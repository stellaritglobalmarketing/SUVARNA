import express from "express";
import {
    getHome,
    getProducts,
    getProductDetails,
    getProductReviews,
    submitProductReview,
    getWishlist,
    addToWishlist,
    removeFromWishlist,
} from "../controllers/product-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const customerOnly = [middleware.tokenMiddleware, middleware.allowedRoles("user")];

// Public, guest-accessible — no auth middleware on these read-only endpoints.
router.get("/home", getHome);
router.get("/", getProducts);

// Static "/wishlist" routes are registered before "/:slug" so they're never read as a product slug.
router.get("/wishlist", ...customerOnly, getWishlist);
router.put("/wishlist/:slug", ...customerOnly, addToWishlist);
router.delete("/wishlist/:slug", ...customerOnly, removeFromWishlist);

router.get("/:slug/reviews", getProductReviews);
router.post("/:slug/reviews", ...customerOnly, submitProductReview);
router.get("/:slug", getProductDetails);

export default router;
