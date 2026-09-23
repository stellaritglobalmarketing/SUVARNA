import bcrypt from "bcryptjs";
import db from "../../../config/db.js";
import dbHelper from "../../../config/dbHelper.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import common from "../../../config/common.js";
import { validateSignup, validateLogin } from "../validators/user-validation.js";

const SALT_ROUNDS = 10;

function toSafeUser(record, role) {
    const safe = {
        id: record.id,
        name: record.name,
        email: record.email,
        role,
    };
    if (role === "user") {
        safe.phone = record.phone;
        safe.is_verified = !!record.is_verified;
    }
    return safe;
}

// Records the issued token in the shared user_devices table so tokenMiddleware
// can validate/revoke sessions for either role later.
async function createDeviceSession(user_id, role, token) {
    await dbHelper.insertQuery("user_devices", { user_id, role, token });
}

const signup = async (req, res) => {
    try {
        const error = validateSignup(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const name = String(req.body.name).trim();
        const phone = String(req.body.phone).trim();
        const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
        const { password } = req.body;

        const [existingPhone] = await db.query(
            "SELECT id FROM users WHERE phone = ? AND is_delete = 0 LIMIT 1",
            [phone]
        );
        if (existingPhone.length > 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Phone number is already registered", null);
        }

        if (email) {
            const [existingEmail] = await db.query(
                "SELECT id FROM users WHERE email = ? AND is_delete = 0 LIMIT 1",
                [email]
            );
            if (existingEmail.length > 0) {
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Email is already registered", null);
            }
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        const [result] = await dbHelper.insertQuery("users", {
            name,
            email,
            phone,
            password_hash,
        });

        const newUser = {
            id: result.insertId,
            name,
            email,
            phone,
            is_verified: 0,
            role: "user",
        };

        const token = await common.generateToken(newUser);
        await createDeviceSession(newUser.id, "user", token);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Signup successful", {
            token,
            user: toSafeUser(newUser, "user"),
        });
    } catch (error) {
        console.error("Error in signup: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const login = async (req, res) => {
    try {
        const error = validateLogin(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const loginValue = String(req.body.login).trim().toLowerCase();
        const { password } = req.body;

        const [userRows] = await db.query(
            `SELECT id, name, email, phone, password_hash, is_verified, is_active, is_delete
             FROM users
             WHERE (email = ? OR phone = ?) AND is_active = 1 AND is_delete = 0
             LIMIT 1`,
            [loginValue, loginValue]
        );

        let account = userRows[0] || null;
        let role = "user";

        if (!account) {
            const [adminRows] = await db.query(
                `SELECT id, name, email, password_hash, role, is_active, is_delete
                 FROM admins
                 WHERE email = ? AND is_active = 1 AND is_delete = 0
                 LIMIT 1`,
                [loginValue]
            );
            if (adminRows[0]) {
                account = adminRows[0];
                role = adminRows[0].role;
            }
        }

        if (!account) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Invalid credentials", null);
        }

        const isMatch = account.password_hash ? await bcrypt.compare(password, account.password_hash) : false;
        if (!isMatch) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Invalid credentials", null);
        }

        const token = await common.generateToken({ ...account, role });
        await createDeviceSession(account.id, role, token);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Login successful", {
            token,
            user: toSafeUser(account, role),
        });
    } catch (error) {
        console.error("Error in login: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { signup, login };
