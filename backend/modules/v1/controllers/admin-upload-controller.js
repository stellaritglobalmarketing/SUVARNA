import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { UPLOAD_ROOT } from "../../../config/uploads.js";

// Admin image upload: the request body is the raw image (Content-Type: image/jpeg | png | webp | avif),
// saved under <UPLOAD_ROOT>/images/<yyyy>/<mm>/ and served by server.js's /uploads static route.
// See config/uploads.js for keeping these files across redeploys.

const MAX_BYTES = 5 * 1024 * 1024;

// Checked against the file's first bytes, so a renamed non-image is rejected.
const FORMATS = {
    "image/jpeg": { ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    "image/png": { ext: "png", matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    "image/webp": { ext: "webp", matches: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
    "image/avif": { ext: "avif", matches: (b) => b.toString("ascii", 4, 12) === "ftypavif" },
};

function publicBaseUrl(req) {
    return (process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
}

const readImageBody = express.raw({ type: Object.keys(FORMATS), limit: MAX_BYTES });

async function handleUpload(req, res) {
    try {
        const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        const format = FORMATS[type];
        if (!format) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Upload a JPEG, PNG, WebP or AVIF image", null);
        }
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "The image is empty", null);
        }
        if (!format.matches(body)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "That file isn't a valid image of the stated type", null);
        }

        const now = new Date();
        const folder = path.join("images", String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
        const filename = `${crypto.randomUUID()}.${format.ext}`;
        await fs.mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
        await fs.writeFile(path.join(UPLOAD_ROOT, folder, filename), body);

        const relative = `${folder.split(path.sep).join("/")}/${filename}`;
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Image uploaded", {
            url: `${publicBaseUrl(req)}/uploads/${relative}`,
            // Stored in product_images.cloudinary_public_id to identify where the file lives.
            public_id: `local:${relative}`,
            bytes: body.length,
        });
    } catch (error) {
        console.error("Admin upload error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't save the image. Please try again.", null);
    }
}

// Express flattens this into [body parser, handler]. A body over the limit raises a 413 that
// server.js's error handler turns into JSON.
const uploadImage = [readImageBody, handleUpload];

export { uploadImage };
