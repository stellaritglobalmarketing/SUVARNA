import express from "express";
import { signup, login, logout, setPassword } from "../controllers/user-controller.js";
import { getAddresses, createAddress, updateAddress, deleteAddress } from "../controllers/address-controller.js";
import middleware from "../../../middleware/middleware.js";

const router = express.Router();
const customerOnly = [middleware.tokenMiddleware, middleware.allowedRoles("user")];

router.post("/signup", signup);
router.post("/login", login);
// Any role — customers and admins both log out through here.
router.post("/logout", middleware.tokenMiddleware, logout);
router.post("/set-password", ...customerOnly, setPassword);

// Saved delivery addresses
router.get("/addresses", ...customerOnly, getAddresses);
router.post("/addresses", ...customerOnly, createAddress);
router.put("/addresses/:id", ...customerOnly, updateAddress);
router.delete("/addresses/:id", ...customerOnly, deleteAddress);

export default router;
