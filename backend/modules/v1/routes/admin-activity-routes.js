import express from "express";
import middleware from "../../../middleware/middleware.js";
import { getActivitySummary, getActivitySessions, getActivitySessionById } from "../controllers/admin-activity-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.get("/activity/summary", ...requireAdmin, getActivitySummary);
router.get("/activity/session", ...requireAdmin, getActivitySessions);
router.get("/activity/session/:id", ...requireAdmin, getActivitySessionById);

export default router;
