import express from "express";
import middleware from "../../../middleware/middleware.js";
import { getInventoryList, getInventoryByVariant, updateInventory, adjustInventory } from "../controllers/admin-inventory-controller.js";

const router = express.Router();
const requireAdmin = [middleware.tokenMiddleware, middleware.allowedRoles("admin")];

router.get("/inventory", ...requireAdmin, getInventoryList);
router.get("/inventory/:variantId", ...requireAdmin, getInventoryByVariant);
router.put("/inventory/:variantId", ...requireAdmin, updateInventory);
router.patch("/inventory/:variantId/adjust", ...requireAdmin, adjustInventory);

export default router;
