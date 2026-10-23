import express from "express";
import { handleEkartWebhook } from "../controllers/ekart-controller.js";
import { handleCashfreeWebhook } from "../controllers/payment-controller.js";

const router = express.Router();

// Called by couriers and the payment gateway, which can't send our API key — mounted before middleware.checkAPI.
// The secret path segment is what authenticates the Ekart call.
router.post("/ekart/:secret", handleEkartWebhook);
// Cashfree signs each call with the secret key (x-webhook-signature + x-webhook-timestamp).
router.post("/cashfree", handleCashfreeWebhook);

export default router;
