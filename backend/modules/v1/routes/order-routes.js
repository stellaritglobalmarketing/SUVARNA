import express from "express";
import { createOrder, getMyOrders, getOrderDetails, cancelOrder } from "../controllers/order-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();

router.post("/", middleware.tokenMiddleware, middleware.allowedRoles("user"), createOrder);
// Static route before the parameterized one, same as /home before /:slug in product-routes.
router.get("/my-orders", middleware.tokenMiddleware, middleware.allowedRoles("user"), getMyOrders);
router.get("/:order_number", middleware.tokenMiddleware, middleware.allowedRoles("user"), getOrderDetails);
router.patch("/:order_number/cancel", middleware.tokenMiddleware, middleware.allowedRoles("user"), cancelOrder);

export default router;
