import express from "express";
import { getReviews, updateReviewStatus, deleteReview } from "../controllers/admin-review-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.get("/review", ...requireAdmin, getReviews);
router.patch("/review/:id/status", ...requireAdmin, updateReviewStatus);
router.delete("/review/:id", ...requireAdmin, deleteReview);

export default router;
