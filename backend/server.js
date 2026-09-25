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
import cors from "cors";

dotenv.config();

const PORT = process.env.PORT || 5020;

const app = express();

const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map(origin => origin.trim());

app.use(cors({
  origin: corsOrigins,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.use("/uploads", express.static("uploads"));

// Unauthenticated health check — lets Render's own health monitor, and an external
// uptime pinger (e.g. cron-job.org / UptimeRobot hitting this every few minutes),
// keep the free-tier instance from spinning down after 15 minutes of inactivity.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use(middleware.checkAPI);

// API Routes
app.use("/api/v1/user/", userRoutes);
app.use("/api/v1/user/", aboutRoutes);
app.use("/api/v1/product/", productRoutes);
app.use("/api/v1/cart/", cartRoutes);
app.use("/api/v1/order/", orderRoutes);
app.use("/api/v1/payment/", paymentRoutes);
app.use("/api/v1/admin/", adminRoutes);
app.use("/api/v1/admin/", adminProductRoutes);
app.use("/api/v1/admin/", adminOrderRoutes);
app.use("/api/v1/admin/", adminInventoryRoutes);
app.use("/api/v1/admin/", adminShippingRoutes);
app.use("/api/v1/admin/", adminReviewRoutes);
app.use("/api/v1/admin/", adminContentRoutes);

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
    return middleware.sendResponse(res, 413, Codes.MISSING_FIELD, "File is too large (max 5 MB)", null);
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

// Start server
async function startServer() {
  try {
    const isConnected = await testDbConnection();
    if (!isConnected) {
      process.exit(1);
    }
    
    // startCronJobs();
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

startServer();

 
