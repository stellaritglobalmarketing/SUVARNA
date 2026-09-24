import bcrypt from "bcryptjs";
import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import common from "../../../config/common.js";
import { validateSignup, validateLogin, normalizePhone } from "../validators/user-validation.js";

const SALT_ROUNDS = 10;
// user_devices.token is varchar(512) and the DB isn't in strict mode, so a longer token would be
// silently truncated and the session could never be matched again — fail loudly instead.
const MAX_TOKEN_LENGTH = 512;

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
async function createDeviceSession(conn, user_id, role, token) {
    if (token.length > MAX_TOKEN_LENGTH) {
        throw new Error(`Session token is ${token.length} chars, longer than user_devices.token allows`);
    }
    await conn.query("INSERT INTO user_devices (user_id, role, token) VALUES (?, ?, ?)", [user_id, role, token]);
}

const signup = async (req, res) => {
    try {
        const error = validateSignup(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const name = String(req.body.name).trim();
        const phone = normalizePhone(req.body.phone);
        const email = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
        const { password } = req.body;

        // No is_delete filter: the unique keys on users.phone / users.email cover soft-deleted
        // accounts too, so a deleted account's phone or email can't be registered again.
        const [existingPhone] = await db.query("SELECT id FROM users WHERE phone = ? LIMIT 1", [phone]);
        if (existingPhone.length > 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Phone number is already registered", null);
        }

        if (email) {
            const [existingEmail] = await db.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
            if (existingEmail.length > 0) {
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Email is already registered", null);
            }
        }

        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Account + session are created together: a failure part-way must not leave an account
        // behind that the customer can neither log into nor sign up with again.
        const conn = await db.getConnection();
        let newUser;
        let token;
        try {
            await conn.beginTransaction();
            const [result] = await conn.query(
                "INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)",
                [name, email, phone, password_hash]
            );
            newUser = { id: result.insertId, name, email, phone, is_verified: 0, role: "user" };
            token = await common.generateToken(newUser);
            await createDeviceSession(conn, newUser.id, "user", token);
            await conn.commit();
        } catch (err) {
            await conn.rollback();
            // Two signups for the same phone/email racing past the checks above.
            if (err.code === "ER_DUP_ENTRY") {
                return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "Phone number or email is already registered", null);
            }
            throw err;
        } finally {
            conn.release();
        }

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

        const rawLogin = String(req.body.login).trim();
        const isEmail = rawLogin.includes("@");
        const loginValue = isEmail ? rawLogin.toLowerCase() : normalizePhone(rawLogin);
        const { password } = req.body;

        const [userRows] = await db.query(
            `SELECT id, name, email, phone, password_hash, is_verified
             FROM users
             WHERE ${isEmail ? "email" : "phone"} = ? AND is_active = 1 AND is_delete = 0
             LIMIT 1`,
            [loginValue]
        );

        let account = userRows[0] || null;
        let role = "user";

        if (!account && isEmail) {
            const [adminRows] = await db.query(
                `SELECT id, name, email, password_hash, role
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

        // Same message for unknown account and wrong password, so the API doesn't reveal which accounts exist.
        const isMatch = account?.password_hash ? await bcrypt.compare(password, account.password_hash) : false;
        if (!isMatch) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Invalid credentials", null);
        }

        const token = await common.generateToken({ ...account, role });
        await createDeviceSession(db, account.id, role, token);

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Login successful", {
            token,
            user: toSafeUser(account, role),
        });
    } catch (error) {
        console.error("Error in login: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// Ends this device's session: the token stops working immediately, other devices stay logged in.
const logout = async (req, res) => {
    try {
        const token = String(req.headers["token"] || req.headers["authorization"] || "").replace("Bearer ", "").trim();
        await db.query(
            "UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND role = ? AND token = ? AND is_delete = 0",
            [req.user.id, req.user.role, token]
        );
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Logged out", null);
    } catch (error) {
        console.error("Error in logout: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { signup, login, logout };
