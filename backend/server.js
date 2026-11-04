import express from "express";
import pool from "./config/db.js";
import dotenv from "dotenv";
import middleware from "./middleware/middleware.js";
import Codes from "./config/status_codes.js";
import userRoutes from "./modules/v1/routes/user-routes.js";
import aboutRoutes from "./modules/v1/routes/about-routes.js";
import productRoutes from "./modules/v1/routes/product-routes.js";
import cartRoutes from "./modules/v1/routes/cart-routes.js";
import orderRoutes from "./modules/v1/routes/order-routes.js";
import paymentRoutes from "./modules/v1/routes/payment-routes.js";
import adminRoutes from "./modules/v1/routes/admin-routes.js";
import adminProductRoutes from "./modules/v1/routes/admin-product-routes.js";
import adminOrderRoutes from "./modules/v1/routes/admin-order-routes.js";
import adminInventoryRoutes from "./modules/v1/routes/admin-inventory-routes.js";
import adminShippingRoutes from "./modules/v1/routes/admin-shipping-routes.js";
import adminReviewRoutes from "./modules/v1/routes/admin-review-routes.js";
import adminContentRoutes from "./modules/v1/routes/admin-content-routes.js";
import shippingRoutes from "./modules/v1/routes/shipping-routes.js";
import webhookRoutes from "./modules/v1/routes/webhook-routes.js";
import activityRoutes from "./modules/v1/routes/activity-routes.js";
import adminActivityRoutes from "./modules/v1/routes/admin-activity-routes.js";
import settingsRoutes from "./modules/v1/routes/settings-routes.js";
import ekart from "./config/ekart.js";
import { syncOpenShipments } from "./modules/v1/services/ekart-shipping.js";
import { purgeOldActivity } from "./modules/v1/services/visitor-activity.js";
import { releaseAbandonedGuestOrders } from "./modules/v1/controllers/payment-controller.js";
import cors from "cors";
import { UPLOAD_ROOT } from "./config/uploads.js";
import { storeUploadPaths } from "./config/public-url.js";

dotenv.config();

const PORT = process.env.PORT || 5020;

const app = express();

// Hosting proxies (Hostinger, Render) end HTTPS and forward plain HTTP. Trusting the proxy
// lets req.protocol read "https", so upload URLs built from the request aren't http://
// links that browsers block on an https site.
app.set("trust proxy", true);

// Browsers send a bare origin ("https://site.com"), so reduce each entry to that: a trailing
// slash, a pasted path like "/api/v1" or a missing scheme would otherwise never match.
const toOrigin = value => {
  try {
    return new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`).origin;
  } catch {
    return value;
  }
};
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean)
  .map(toOrigin);

app.use(cors({
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));

// The raw bytes are kept for webhook signature checks (Razorpay signs the body exactly as sent).
app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));

// Strips this backend's own host from uploaded-file URLs in request bodies, so only "/uploads/…" is stored.
app.use(storeUploadPaths);

app.use("/uploads", express.static(UPLOAD_ROOT, { maxAge: "30d", immutable: true }));

// Unauthenticated health check — lets Render's own health monitor, and an external
// uptime pinger (e.g. cron-job.org / UptimeRobot hitting this every few minutes),
// keep the free-tier instance from spinning down after 15 minutes of inactivity.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Courier webhooks can't send our API key; each authenticates with its own secret instead.
app.use("/api/v1/webhooks/", webhookRoutes);

app.use(middleware.checkAPI);

// API Routes
app.use("/api/v1/user/", userRoutes);
app.use("/api/v1/user/", aboutRoutes);
app.use("/api/v1/product/", productRoutes);
app.use("/api/v1/cart/", cartRoutes);
app.use("/api/v1/order/", orderRoutes);
app.use("/api/v1/payment/", paymentRoutes);
app.use("/api/v1/shipping/", shippingRoutes);
app.use("/api/v1/settings", settingsRoutes);
app.use("/api/v1/activity/", activityRoutes);
app.use("/api/v1/admin/", adminRoutes);
app.use("/api/v1/admin/", adminProductRoutes);
app.use("/api/v1/admin/", adminOrderRoutes);
app.use("/api/v1/admin/", adminInventoryRoutes);
app.use("/api/v1/admin/", adminShippingRoutes);
app.use("/api/v1/admin/", adminReviewRoutes);
app.use("/api/v1/admin/", adminContentRoutes);
app.use("/api/v1/admin/", adminActivityRoutes);

// Unknown routes and unhandled errors answer in the same JSON envelope as every other
// response, instead of Express's default HTML pages, so the apps can always parse them.
app.use((_req, res) => {
  middleware.sendResponse(res, 404, Codes.NO_DATA_FOUND, "Route not found", null);
});

app.use((err, _req, res, _next) => {
  // Malformed JSON request body (from express.json()).
  if (err.type === "entity.parse.failed") {
    return middleware.sendResponse(res, 400, Codes.MISSING_FIELD, "Request body is not valid JSON", null);
  }
  if (err.type === "entity.too.large") {
    // Upload routes set limits in whole MB (5 for images, 50 for videos); express.json's default is 100 KB.
    const message = err.limit >= 1024 * 1024 ? `File is too large (max ${Math.round(err.limit / (1024 * 1024))} MB)` : "Request is too large";
    return middleware.sendResponse(res, 413, Codes.MISSING_FIELD, message, null);
  }
  console.error("Unhandled error:", err);
  return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
});

//uploads folder for static files
// Test database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("✓ Database connection established successfully");
    return true;
  } catch (error) {
    console.error("✗ Database connection failed:", error.message);
    return false;
  }
}

// Safety net for missed Ekart webhooks: every EKART_SYNC_INTERVAL_MINUTES (default 60), re-fetch
// tracking for open Ekart shipments that haven't been updated in that long. 0 turns it off.
function startEkartSync() {
  const minutes = Number(process.env.EKART_SYNC_INTERVAL_MINUTES ?? 60);
  if (!ekart.isConfigured() || !Number.isFinite(minutes) || minutes <= 0) {
    return;
  }
  const run = () =>
    syncOpenShipments({ staleMinutes: minutes })
      .then(({ synced, failed }) => {
        if (synced || failed) console.log(`Ekart sync: ${synced} updated, ${failed} failed`);
      })
      .catch((error) => console.error("Ekart sync error:", error.message));
  setInterval(run, minutes * 60 * 1000);
  setTimeout(run, 30 * 1000);
  console.log(`✓ Ekart tracking sync every ${minutes} min`);
}

// User Activity rows are only kept for ACTIVITY_RETENTION_DAYS (default 90), checked daily. 0 keeps them forever.
function startActivityCleanup() {
  const days = Number(process.env.ACTIVITY_RETENTION_DAYS ?? 90);
  if (!Number.isFinite(days) || days <= 0) {
    return;
  }
  const run = () =>
    purgeOldActivity(days)
      .then((deleted) => {
        if (deleted) console.log(`User activity cleanup: ${deleted} old visits deleted`);
      })
      .catch((error) => console.error("User activity cleanup error:", error.message));
  setInterval(run, 24 * 60 * 60 * 1000);
  setTimeout(run, 60 * 1000);
}

// Guest orders nobody paid for give their stock back (releaseAbandonedGuestOrders).
function startGuestOrderSweep() {
  const run = () =>
    releaseAbandonedGuestOrders()
      .then((released) => {
        if (released) console.log(`Guest order sweep: ${released} unpaid orders released`);
      })
      .catch((error) => console.error("Guest order sweep error:", error.message));
  setInterval(run, 15 * 60 * 1000);
  setTimeout(run, 90 * 1000);
}

// Start server
async function startServer() {
  try {
    const isConnected = await testDbConnection();
    if (!isConnected) {
      process.exit(1);
    }
    // startCronJobs();
    startEkartSync();
    startActivityCleanup();
    startGuestOrderSweep();
    // Express 5 reports a failed listen (such as a port already in use) here, not by throwing.
    app.listen(PORT, (error) => {
      if (error) {
        console.error(`✗ Server could not start on port ${PORT}: ${error.code === "EADDRINUSE" ? "another program is already using this port" : error.message}`);
        process.exit(1);
      }
      console.log(`✓ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();