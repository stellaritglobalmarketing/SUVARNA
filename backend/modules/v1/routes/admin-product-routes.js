import express from "express";
import middleware from "../../../middleware/middleware.js";
import {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    updateProductStatus,
    deleteProduct,
    createVariant,
    getVariantsByProduct,
    getVariantById,
    updateVariant,
    updateVariantStatus,
    deleteVariant,
    createImage,
    getImagesByProduct,
    updateImage,
    setPrimaryImage,
    deleteImage,
} from "../controllers/admin-product-controller.js";

import { updateProductContent } from "../controllers/admin-product-content-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

// Product
router.post("/product", ...requireAdmin, createProduct);
router.get("/product", ...requireAdmin, getProducts);
router.get("/product/:id", ...requireAdmin, getProductById);
router.put("/product/:id", ...requireAdmin, updateProduct);
router.patch("/product/:id/status", ...requireAdmin, updateProductStatus);
router.delete("/product/:id", ...requireAdmin, deleteProduct);
// Product-page content: nutrients, lipid profile, certifications, health benefits, storage tips, related products
router.put("/product/:id/content", ...requireAdmin, updateProductContent);

// Variant (nested under product for create/list, flat for id-based ops)
router.post("/product/:productId/variant", ...requireAdmin, createVariant);
router.get("/product/:productId/variant", ...requireAdmin, getVariantsByProduct);
router.get("/variant/:id", ...requireAdmin, getVariantById);
router.put("/variant/:id", ...requireAdmin, updateVariant);
router.patch("/variant/:id/status", ...requireAdmin, updateVariantStatus);
router.delete("/variant/:id", ...requireAdmin, deleteVariant);

// Image (nested under product for create/list, flat for id-based ops)
router.post("/product/:productId/image", ...requireAdmin, createImage);
router.get("/product/:productId/image", ...requireAdmin, getImagesByProduct);
router.put("/image/:id", ...requireAdmin, updateImage);
router.patch("/image/:id/primary", ...requireAdmin, setPrimaryImage);
router.delete("/image/:id", ...requireAdmin, deleteImage);

export default router;
