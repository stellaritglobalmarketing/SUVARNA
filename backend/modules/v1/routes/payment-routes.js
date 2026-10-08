import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment, syncRazorpayPayment } from "../controllers/payment-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const customerOnly = [middleware.tokenMiddleware, middleware.allowedRoles("user")];

router.post("/razorpay/order", ...customerOnly, createRazorpayOrder);
router.post("/razorpay/verify", ...customerOnly, verifyRazorpayPayment);
// Re-checks with Razorpay when the customer comes back to an unpaid order (paid, but the callback was lost).
router.post("/razorpay/sync", ...customerOnly, syncRazorpayPayment);

export default router;
