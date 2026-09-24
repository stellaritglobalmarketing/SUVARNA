import nodemailer from "nodemailer";
import { fileURLToPath } from "node:url";
import jwt from "jsonwebtoken";
import "dotenv/config";

const common = {

     async checkUniqueEmail(request) {
        try {
            const sql = "SELECT id, email FROM tbl_user WHERE email = ? AND is_delete = 0 LIMIT 1";
            const result = await db.query(sql, [request.email]);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error("Error checking unique email: ", error);
            throw error;
        }
    },

    async checkUniqueMobileNumber(request) {
        try {
            const sql = "SELECT id, mobile_number FROM tbl_user WHERE country_code = ? AND mobile_number = ? AND is_delete = 0 LIMIT 1";
            const result = await db.query(sql, [request.country_code, request.mobile_number]);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error("Error checking unique mobile number: ", error);
            throw error;
        }
    },

      async getUserDetails(request) {
        try {
            let sql = "SELECT * FROM tbl_user WHERE is_delete = 0";
            const params = [];

            if (request?.id) {
                sql += " AND id = ? LIMIT 1";
                params.push(request.id);
            } else {
                sql += " ORDER BY id DESC";
            }

            const result = await db.query(sql, params);
            return request?.id ? (result && result.length > 0 ? result[0] : null) : (result || []);
        } catch (error) {
            console.error("Error fetching user details: ", error);
            return null;
        }
    },

        
    getUserCart : async function (user_id) {
        try {
            const sql = `SELECT c.id as cart_id, c.quantity, v.id as variant_id, v.product_id, v.size_id, v.color_id, v.type_id
            FROM tbl_cart c
            JOIN tbl_product_variant v ON c.variant_id = v.id
            WHERE c.user_id = ? AND c.is_active = 1 AND c.is_delete = 0`;
            const result = await db.query(sql, [user_id]);
            return result || [];
        } catch (error) {
            console.error("Error fetching user cart: ", error);
            return [];
        }
    },

    generateToken: async function (user) {
        try {
            const normalizedUser = Array.isArray(user) ? user[0] : user;

            if (!normalizedUser || !normalizedUser.id) {
                throw new Error("Invalid user data for token generation");
            }

            // Only what tokenMiddleware/handlers read (req.user.id, req.user.role). Profile fields
            // stay out of the token: they made its length depend on the user's name/email, and
            // tokens longer than user_devices.token (512) were silently truncated on insert, so
            // that user's session could never be found again.
            const payload = {
                id: normalizedUser.id,
                role: normalizedUser.role || null,
            };
            const jwtSecret = process.env.JWT_WEB_TOKEN;
            if (!jwtSecret) {
                throw new Error("JWT_WEB_TOKEN is not configured");
            }

            return jwt.sign(payload, jwtSecret, { expiresIn: "365d" });

        } catch (error) {
            console.log(error);
            throw error;
        }
    },

}

export default common;
