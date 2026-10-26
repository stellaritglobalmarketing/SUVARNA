import express from "express";
import { handleEkartWebhook } from "../controllers/ekart-controller.js";
import { handleRazorpayWebhook } from "../controllers/payment-controller.js";

const router = express.Router();

// Called by couriers, which can't send our API key — mounted before middleware.checkAPI.
// The secret path segment is what authenticates the call.
router.post("/ekart/:secret", handleEkartWebhook);
// Razorpay signs each call with RAZORPAY_WEBHOOK_SECRET (X-Razorpay-Signature).
router.post("/razorpay", handleRazorpayWebhook);

export default router;
