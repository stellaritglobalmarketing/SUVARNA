import express from "express";
import { createPaymentOrder, verifyPayment, syncPayment } from "../controllers/payment-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const customerOnly = [middleware.tokenMiddleware, middleware.allowedRoles("user")];

router.post("/order", ...customerOnly, createPaymentOrder);
router.post("/verify", ...customerOnly, verifyPayment);
// Re-checks with Cashfree when the customer comes back to an unpaid order (paid, but the callback was lost).
router.post("/sync", ...customerOnly, syncPayment);

export default router;
