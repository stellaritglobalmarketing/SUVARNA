import express from "express";
import middleware from "../../../middleware/middleware.js";
import { getOrders, getOrderByNumber, updateOrderStatus } from "../controllers/admin-order-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.get("/order", ...requireAdmin, getOrders);
router.get("/order/:orderNumber", ...requireAdmin, getOrderByNumber);
router.patch("/order/:orderNumber/status", ...requireAdmin, updateOrderStatus);

export default router;
