import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/payment-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const customerOnly = [middleware.tokenMiddleware, middleware.allowedRoles("user")];

router.post("/razorpay/order", ...customerOnly, createRazorpayOrder);
router.post("/razorpay/verify", ...customerOnly, verifyRazorpayPayment);

export default router;
