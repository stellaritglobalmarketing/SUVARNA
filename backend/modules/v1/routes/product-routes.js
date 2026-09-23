import express from "express";
import { getHome, getProducts, getProductDetails, toggleWishlist } from "../controllers/product-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();

// Public, guest-accessible — no auth middleware on these read-only endpoints.
router.get("/home", getHome);
router.get("/", getProducts);
router.post("/wishlist/toggle", middleware.tokenMiddleware, middleware.allowedRoles("user"), toggleWishlist);
router.get("/:slug", getProductDetails);

export default router;
