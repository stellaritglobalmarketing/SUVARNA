import express from "express";
import {
    listContent,
    createContent,
    updateContent,
    updateContentStatus,
    deleteContent,
} from "../controllers/admin-content-controller.js";
import { uploadImage } from "../controllers/admin-upload-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

// Home page content — :resource is one of banners | highlights | testimonials | faqs | hampers
router.get("/content/:resource", ...requireAdmin, listContent);
router.post("/content/:resource", ...requireAdmin, createContent);
router.put("/content/:resource/:id", ...requireAdmin, updateContent);
router.patch("/content/:resource/:id/status", ...requireAdmin, updateContentStatus);
router.delete("/content/:resource/:id", ...requireAdmin, deleteContent);

// Image upload for products, categories, banners and hampers. The body is the raw file.
router.post("/upload", ...requireAdmin, uploadImage);

export default router;
