import express from "express";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { UPLOAD_ROOT } from "../../../config/uploads.js";

// Admin media upload: the request body is the raw file (Content-Type: image/jpeg | png | webp | avif,
// or video/mp4 | webm | quicktime), saved under <UPLOAD_ROOT>/<images|videos>/<yyyy>/<mm>/ and served
// by server.js's /uploads static route. See config/uploads.js for keeping these files across redeploys.

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

// MP4 and MOV both start with an ISO "ftyp" box at byte 4.
const hasFtypBox = (b) => b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp";

// Checked against the file's first bytes, so a renamed file of another kind is rejected.
const FORMATS = {
    "image/jpeg": { kind: "image", ext: "jpg", matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
    "image/png": { kind: "image", ext: "png", matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
    "image/webp": { kind: "image", ext: "webp", matches: (b) => b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" },
    "image/avif": { kind: "image", ext: "avif", matches: (b) => b.toString("ascii", 4, 12) === "ftypavif" },
    "video/mp4": { kind: "video", ext: "mp4", matches: hasFtypBox },
    "video/quicktime": { kind: "video", ext: "mov", matches: hasFtypBox },
    "video/webm": { kind: "video", ext: "webm", matches: (b) => b.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])) },
};

const typesOf = (kind) => Object.keys(FORMATS).filter((type) => FORMATS[type].kind === kind);

// Each parser only reads its own content types, so images and videos get separate size limits.
const readImageBody = express.raw({ type: typesOf("image"), limit: MAX_IMAGE_BYTES });
const readVideoBody = express.raw({ type: typesOf("video"), limit: MAX_VIDEO_BYTES });

async function handleUpload(req, res) {
    try {
        const type = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
        const format = FORMATS[type];
        if (!format) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Upload a JPEG, PNG, WebP or AVIF image, or an MP4, WebM or MOV video", null);
        }
        const body = req.body;
        if (!Buffer.isBuffer(body) || body.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "The file is empty", null);
        }
        if (!format.matches(body)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "That file isn't a valid file of the stated type", null);
        }

        const now = new Date();
        const folder = path.join(`${format.kind}s`, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"));
        const filename = `${crypto.randomUUID()}.${format.ext}`;
        await fs.mkdir(path.join(UPLOAD_ROOT, folder), { recursive: true });
        await fs.writeFile(path.join(UPLOAD_ROOT, folder, filename), body);

        const relative = `${folder.split(path.sep).join("/")}/${filename}`;
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, format.kind === "video" ? "Video uploaded" : "Image uploaded", {
            // Stored as is; sendResponse adds the host for this response (see config/public-url.js).
            url: `/uploads/${relative}`,
            // Stored in product_images.cloudinary_public_id to identify where the file lives.
            public_id: `local:${relative}`,
            media_type: format.kind,
            bytes: body.length,
        });
    } catch (error) {
        console.error("Admin upload error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Couldn't save the file. Please try again.", null);
    }
}

// Express flattens this into [body parsers, handler]. A body over the limit raises a 413 that
// server.js's error handler turns into JSON.
const uploadImage = [readImageBody, readVideoBody, handleUpload];

export { uploadImage };
