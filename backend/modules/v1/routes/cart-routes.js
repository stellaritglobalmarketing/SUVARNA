import express from "express";
import { addToCart, getCart, updateCartItem, removeCartItem, clearCart } from "../controllers/cart-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();

router.post("/", middleware.tokenMiddleware, middleware.allowedRoles("user"), addToCart);
router.get("/", middleware.tokenMiddleware, middleware.allowedRoles("user"), getCart);
// Static route before the parameterized one to avoid any ambiguity.
router.delete("/", middleware.tokenMiddleware, middleware.allowedRoles("user"), clearCart);
router.put("/:id", middleware.tokenMiddleware, middleware.allowedRoles("user"), updateCartItem);
router.delete("/:id", middleware.tokenMiddleware, middleware.allowedRoles("user"), removeCartItem);

export default router;
