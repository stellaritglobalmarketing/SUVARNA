import express from "express";
import middleware from "../../../middleware/middleware.js";
import { createShipmentForOrder, getShipments, getShipmentById, updateShipmentStatus } from "../controllers/admin-shipping-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.post("/order/:orderNumber/shipment", ...requireAdmin, createShipmentForOrder);
router.get("/shipment", ...requireAdmin, getShipments);
router.get("/shipment/:id", ...requireAdmin, getShipmentById);
router.patch("/shipment/:id/status", ...requireAdmin, updateShipmentStatus);

export default router;
