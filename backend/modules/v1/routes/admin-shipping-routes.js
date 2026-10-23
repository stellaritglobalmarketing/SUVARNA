import express from "express";
import middleware from "../../../middleware/middleware.js";
import { createShipmentForOrder, getShipments, getShipmentById, updateShipmentStatus } from "../controllers/admin-shipping-controller.js";
import {
    getEkartQuote,
    createEkartShipment,
    syncEkartShipment,
    cancelEkartShipment,
    downloadEkartLabel,
    generateEkartManifest,
    ekartNdrAction,
    getEkartStatus,
    registerEkartWebhook,
    listEkartAddresses,
    addEkartAddress,
    setEkartPickup,
    getEkartSettingsHandler,
    updateEkartSettingsHandler,
} from "../controllers/ekart-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.post("/order/:orderNumber/shipment", ...requireAdmin, createShipmentForOrder);
router.get("/shipment", ...requireAdmin, getShipments);
router.get("/shipment/:id", ...requireAdmin, getShipmentById);
router.patch("/shipment/:id/status", ...requireAdmin, updateShipmentStatus);

// Ekart: book, label, manifest, track, cancel, failed-delivery (NDR) actions, account setup
router.get("/order/:orderNumber/ekart/quote", ...requireAdmin, getEkartQuote);
router.post("/order/:orderNumber/ekart/shipment", ...requireAdmin, createEkartShipment);
router.post("/shipment/manifest", ...requireAdmin, generateEkartManifest);
router.get("/shipment/:id/label", ...requireAdmin, downloadEkartLabel);
router.post("/shipment/:id/sync", ...requireAdmin, syncEkartShipment);
router.post("/shipment/:id/cancel", ...requireAdmin, cancelEkartShipment);
router.post("/shipment/:id/ndr", ...requireAdmin, ekartNdrAction);
router.get("/shipping/ekart/status", ...requireAdmin, getEkartStatus);
router.post("/shipping/ekart/webhook", ...requireAdmin, registerEkartWebhook);
router.get("/shipping/ekart/addresses", ...requireAdmin, listEkartAddresses);
router.post("/shipping/ekart/addresses", ...requireAdmin, addEkartAddress);
router.put("/shipping/ekart/pickup", ...requireAdmin, setEkartPickup);
router.get("/shipping/ekart/settings", ...requireAdmin, getEkartSettingsHandler);
router.put("/shipping/ekart/settings", ...requireAdmin, updateEkartSettingsHandler);

export default router;
