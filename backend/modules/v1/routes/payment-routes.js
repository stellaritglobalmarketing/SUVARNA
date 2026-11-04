import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment, syncRazorpayPayment } from "../controllers/payment-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();

router.post("/razorpay/order", middleware.customerOrGuest, createRazorpayOrder);
router.post("/razorpay/verify", middleware.customerOrGuest, verifyRazorpayPayment);
// Re-checks with Razorpay when the customer comes back to an unpaid order (paid, but the callback was lost).
router.post("/razorpay/sync", middleware.customerOrGuest, syncRazorpayPayment);

export default router;
