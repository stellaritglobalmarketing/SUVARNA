import express from "express";
import { getServiceability } from "../controllers/ekart-controller.js";

const router = express.Router();

// Public (API key only): the storefront's "Check delivery" box and checkout.
router.get("/serviceability/:pincode", getServiceability);

export default router;
