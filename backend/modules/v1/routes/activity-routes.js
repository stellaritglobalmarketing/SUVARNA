import express from "express";
import { trackEvent } from "../controllers/activity-controller.js";

const router = express.Router();

// API key only, no login: guests' visits are recorded too.
router.post("/event", trackEvent);

export default router;
