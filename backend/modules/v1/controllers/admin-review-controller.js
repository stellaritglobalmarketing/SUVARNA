import db from "../../../config/db.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

/**
 * GET /admin/review — moderation queue. Query: status (pending | approved, default pending),
 * product_id, page, limit. Newest first.
 */
const getReviews = async (req, res) => {
    try {
        const page = isPositiveInt(req.query.page) ? Number(req.query.page) : 1;
        const limit = isPositiveInt(req.query.limit) ? Math.min(Number(req.query.limit), MAX_LIMIT) : DEFAULT_LIMIT;
        const approved = req.query.status === "approved" ? 1 : 0;

        const conditions = ["r.is_delete = 0", "r.is_approved = ?"];
        const params = [approved];
        if (isPositiveInt(req.query.product_id)) {
            conditions.push("r.product_id = ?");
            params.push(Number(req.query.product_id));
        }
        const where = conditions.join(" AND ");

        const [[[{ total }]], [rows]] = await Promise.all([
            db.query(`SELECT COUNT(*) AS total FROM reviews r WHERE ${where}`, params),
            db.query(
                `SELECT r.id, r.rating, r.title, r.review_text, r.is_verified_purchase, r.is_approved, r.created_at, r.updated_at,
                        p.id AS product_id, p.name AS product_name, p.slug AS product_slug,
                        u.id AS user_id, u.name AS user_name, u.phone AS user_phone
                 FROM reviews r
                 JOIN products p ON p.id = r.product_id
                 JOIN users u ON u.id = r.user_id
                 WHERE ${where}
                 ORDER BY r.created_at DESC, r.id DESC
                 LIMIT ? OFFSET ?`,
                [...params, limit, (page - 1) * limit]
            ),
        ]);

        return middleware.sendResponse(
            res,
            Codes.SUCCESS,
            Codes.RESPONSE_SUCCESS,
            "Reviews fetched successfully",
            rows.map((r) => ({
                id: r.id,
                rating: r.rating,
                title: r.title,
                review_text: r.review_text,
                is_verified_purchase: !!r.is_verified_purchase,
                is_approved: !!r.is_approved,
                created_at: r.created_at,
                updated_at: r.updated_at,
                product: { id: r.product_id, name: r.product_name, slug: r.product_slug },
                customer: { id: r.user_id, name: r.user_name, phone: r.user_phone },
            })),
            { current_page: page, per_page: limit, total, total_pages: total > 0 ? Math.ceil(total / limit) : 0 }
        );
    } catch (error) {
        console.error("Admin get reviews error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

/** PATCH /admin/review/:id/status { is_approved: 0 | 1 } — approved reviews count towards the product's rating. */
const updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const value = Number(req.body?.is_approved);
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Review not found", null);
        }
        if (![0, 1].includes(value) || req.body?.is_approved === undefined) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "is_approved must be 0 or 1", null);
        }

        const [result] = await db.query("UPDATE reviews SET is_approved = ? WHERE id = ? AND is_delete = 0", [value, id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Review not found", null);
        }
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, value ? "Review approved" : "Review hidden", {
            id: Number(id),
            is_approved: !!value,
        });
    } catch (error) {
        console.error("Admin update review status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

/** DELETE /admin/review/:id — soft delete. */
const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Review not found", null);
        }
        const [result] = await db.query("UPDATE reviews SET is_delete = 1 WHERE id = ? AND is_delete = 0", [id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Review not found", null);
        }
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Review deleted", null);
    } catch (error) {
        console.error("Admin delete review error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { getReviews, updateReviewStatus, deleteReview };
