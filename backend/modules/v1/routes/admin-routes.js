import express from "express";
import middleware from "../../../middleware/middleware.js";
import { getDashboard, getCustomers, getCustomerById, updateCustomerStatus } from "../controllers/admin-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.get("/dashboard", ...requireAdmin, getDashboard);
router.get("/customer", ...requireAdmin, getCustomers);
router.get("/customer/:id", ...requireAdmin, getCustomerById);
router.patch("/customer/:id/status", ...requireAdmin, updateCustomerStatus);

export default router;
