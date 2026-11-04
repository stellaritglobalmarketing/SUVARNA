import express from "express";
import { createOrder, createGuestOrder, trackOrderByPhone, getMyOrders, getOrderDetails, cancelOrder } from "../controllers/order-controller.js";
import { getMyInvoice } from "../controllers/invoice-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();

router.post("/", middleware.tokenMiddleware, middleware.allowedRoles("user"), createOrder);
// Public (API key only). Each guest order holds stock, so one address can't place many.
router.post("/guest", middleware.rateLimit({ max: 20, windowMs: 60 * 60 * 1000 }), createGuestOrder);
router.post("/track", middleware.rateLimit({ max: 30, windowMs: 15 * 60 * 1000 }), trackOrderByPhone);
// Static route before the parameterized one, same as /home before /:slug in product-routes.
router.get("/my-orders", middleware.tokenMiddleware, middleware.allowedRoles("user"), getMyOrders);
router.get("/:order_number", middleware.customerOrGuest, getOrderDetails);
router.get("/:order_number/invoice", middleware.customerOrGuest, getMyInvoice);
router.patch("/:order_number/cancel", middleware.tokenMiddleware, middleware.allowedRoles("user"), cancelOrder);

export default router;
