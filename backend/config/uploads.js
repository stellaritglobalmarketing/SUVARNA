import path from "node:path";
import { fileURLToPath } from "node:url";

// Where admin-uploaded images live, served publicly at /uploads by server.js.
// Anchored to the backend folder rather than the process's working directory, so the file
// written by the upload route and the file served back are always the same one.
// Set UPLOAD_DIR to a folder outside the deployed code when the host replaces that code on
// every redeploy, or uploaded images disappear after the next deploy.
const BACKEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const UPLOAD_ROOT = process.env.UPLOAD_DIR
    ? path.resolve(BACKEND_ROOT, process.env.UPLOAD_DIR)
    : path.join(BACKEND_ROOT, "public", "uploads");
