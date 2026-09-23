import express from "express";
import middleware from "../../../middleware/middleware.js";
import {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
    createSubCategory,
    getSubCategories,
    getSubCategoryById,
    updateSubCategory,
    updateSubCategoryStatus,
    deleteSubCategory,
} from "../controllers/admin-category-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.post("/category", ...requireAdmin, createCategory);
router.get("/category", ...requireAdmin, getCategories);
router.get("/category/:id", ...requireAdmin, getCategoryById);
router.put("/category/:id", ...requireAdmin, updateCategory);
router.patch("/category/:id/status", ...requireAdmin, updateCategoryStatus);
router.delete("/category/:id", ...requireAdmin, deleteCategory);

router.post("/subcategory", ...requireAdmin, createSubCategory);
router.get("/subcategory", ...requireAdmin, getSubCategories);
router.get("/subcategory/:id", ...requireAdmin, getSubCategoryById);
router.put("/subcategory/:id", ...requireAdmin, updateSubCategory);
router.patch("/subcategory/:id/status", ...requireAdmin, updateSubCategoryStatus);
router.delete("/subcategory/:id", ...requireAdmin, deleteSubCategory);

export default router;
