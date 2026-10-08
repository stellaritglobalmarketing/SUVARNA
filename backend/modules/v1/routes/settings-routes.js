import express from "express";
import { getSettings } from "../controllers/settings-controller.js";

const router = express.Router();

// Public store settings (the WhatsApp number shown on the site). API key only, no login.
router.get("/", getSettings);

export default router;
