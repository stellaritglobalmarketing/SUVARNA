// Uploaded files are stored in the database as site-relative paths ("/uploads/videos/2026/10/x.mp4"),
// never with a host, so the same rows work locally and live. The host is added only when a response
// goes out, from PUBLIC_URL (set it live, e.g. https://api.example.com) or else the request's own host.

const UPLOADS_PREFIX = "/uploads/";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/** "https://api.example.com" — PUBLIC_URL, or the host this request came in on. */
function publicBaseUrl(req) {
    const configured = process.env.PUBLIC_URL?.trim();
    if (configured) return configured.replace(/\/$/, "");
    return req ? `${req.protocol}://${req.get("host")}` : "";
}

const isPlainObject = (value) => value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;

/** Deep copy of `value` with every "/uploads/…" string turned into an absolute URL on `base`. */
function withPublicUrls(value, base) {
    if (typeof value === "string") {
        return base && value.startsWith(UPLOADS_PREFIX) ? `${base}${value}` : value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => withPublicUrls(item, base));
    }
    if (isPlainObject(value)) {
        const out = {};
        for (const [key, item] of Object.entries(value)) out[key] = withPublicUrls(item, base);
        return out;
    }
    return value; // numbers, booleans, null, Date, Buffer…
}

/**
 * "http://localhost:5020/uploads/x.png" → "/uploads/x.png" when the URL points at this backend's own
 * uploads (this request's host, PUBLIC_URL's host, or a local host). Anything else is returned as is.
 */
function toStoredPath(value, req) {
    if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return value;
    let url;
    try {
        url = new URL(value);
    } catch {
        return value;
    }
    if (!url.pathname.startsWith(UPLOADS_PREFIX)) return value;

    const ownHosts = new Set(LOCAL_HOSTS);
    if (req?.get?.("host")) ownHosts.add(req.get("host").split(":")[0]);
    try {
        if (process.env.PUBLIC_URL) ownHosts.add(new URL(process.env.PUBLIC_URL).hostname);
    } catch {
        // An unparsable PUBLIC_URL just doesn't count as an own host.
    }
    return ownHosts.has(url.hostname) ? `${url.pathname}${url.search}` : value;
}

/** Same as toStoredPath, applied to every string in a parsed request body (in place). */
function storeUploadPathsInBody(body, req) {
    if (Array.isArray(body)) {
        body.forEach((item, index) => {
            body[index] = typeof item === "string" ? toStoredPath(item, req) : (storeUploadPathsInBody(item, req), item);
        });
    } else if (isPlainObject(body)) {
        for (const [key, item] of Object.entries(body)) {
            body[key] = typeof item === "string" ? toStoredPath(item, req) : (storeUploadPathsInBody(item, req), item);
        }
    }
    return body;
}

/** Express middleware: request bodies never carry this backend's host into the database. */
function storeUploadPaths(req, _res, next) {
    if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
        storeUploadPathsInBody(req.body, req);
    }
    next();
}

export { UPLOADS_PREFIX, publicBaseUrl, withPublicUrls, toStoredPath, storeUploadPaths };
