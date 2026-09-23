import jwt from "jsonwebtoken";
import db from "../config/db.js";
import Codes from "../config/status_codes.js";
const sendResponse = (res, httpStatus = Codes.SUCCESS, resCode, message, data, pagination) => {
    const response = {
        code: resCode,
        message: message || "",
    };

    if (data != null) {
        response.data = data;
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

export default {
    sendResponse,
    checkAPI,
    tokenMiddleware,
    allowedRoles,
};