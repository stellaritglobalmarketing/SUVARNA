import jwt from "jsonwebtoken";
import db from "../config/db.js";
import Codes from "../config/status_codes.js";
import { publicBaseUrl, withPublicUrls } from "../config/public-url.js";

const sendResponse = (res, httpStatus = Codes.SUCCESS, resCode, message, data, pagination) => {
    const response = {
        code: resCode,
        message: message || "",
    };

    if (data != null) {
        // Uploaded files are stored as "/uploads/…"; clients get absolute URLs on this backend's host.
        response.data = withPublicUrls(data, publicBaseUrl(res.req));
    }

    if (pagination != null) {
        response.pagination = pagination;
    }

    return res.status(httpStatus).json(response);
};

const checkAPI = (req, res, next) => {
    try {
        const apiKey = req.headers['api-key'];
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return sendResponse(
                res,
                Codes.UNAUTHORIZED,
                Codes.INVALID_APIKEY,
                "Unauthorized",
                null
            );
        }
        next();
    } catch (error) {
        console.log("Error in API key verification: ", error);
        return sendResponse(
            res,
            Codes.UNAUTHORIZED,
            Codes.INVALID_APIKEY,
            "Unauthorized",
            null
        );
    }
}


const allowedRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return sendResponse(res, Codes.UNAUTHORIZED, Codes.RESPONSE_ERROR, "Access denied", null);
        }
        next();
    };
};

// Verifies the JWT, then confirms the exact token is still an active, non-deleted
// session in user_devices (one shared table for both "user" and "admin" roles) and
// that the underlying account (users/admins, picked by role) is still active.
async function tokenMiddleware(req, res, next) {
    const token = req.headers['token'] || req.headers['authorization'];
    if (!token) {
        return sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "Token missing", null);
    }

    const bearerToken = token.replace("Bearer ", "").trim();

    let decoded;
    try {
        decoded = jwt.verify(bearerToken, process.env.JWT_WEB_TOKEN);
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "Token_expired_Please_login_again", null);
        }
        return sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "Invalid_token", null);
    }

    const accountTable = decoded.role === "admin" ? "admins" : "users";

    const [rows] = await db.query(
        `SELECT ud.id AS device_id, acc.is_active, acc.is_delete
         FROM user_devices ud
         JOIN ${accountTable} acc ON acc.id = ud.user_id
         WHERE ud.user_id = ? AND ud.role = ? AND ud.token = ? AND ud.is_active = 1 AND ud.is_delete = 0
         LIMIT 1`,
        [decoded.id, decoded.role, bearerToken]
    );

    if (rows.length === 0) {
        return sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "You_Are_Not_Logged_In", null);
    }

    if (rows[0].is_active == 0 || rows[0].is_delete == 1) {
        return sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "Account_deactivated", null);
    }

    req.user = decoded;
    next();
}

// Order and payment routes open to the browser that placed a guest order. The token itself is checked
// against the order by orderOwnerClause. A session is still validated when one is sent.
function customerOrGuest(req, res, next) {
    if (req.headers['token'] || req.headers['authorization']) {
        return tokenMiddleware(req, res, () => allowedRoles("user")(req, res, next));
    }
    if (req.headers['guest-token']) {
        return next();
    }
    return sendResponse(res, Codes.UNAUTHORIZED, Codes.INVALID_TOKEN, "Token missing", null);
}

// Per-IP cap for public routes that create orders or look them up. Kept in memory, so it's per process.
function rateLimit({ max, windowMs }) {
    const hits = new Map();
    let windowStart = 0;
    return (req, res, next) => {
        const now = Date.now();
        if (now - windowStart >= windowMs) {
            windowStart = now;
            hits.clear();
        }
        const count = (hits.get(req.ip) ?? 0) + 1;
        hits.set(req.ip, count);
        if (count > max) {
            return sendResponse(res, 429, Codes.RESPONSE_ERROR, "Too many attempts. Please try again in a little while.", null);
        }
        next();
    };
}

export default {
    sendResponse,
    checkAPI,
    tokenMiddleware,
    allowedRoles,
    customerOrGuest,
    rateLimit,
};