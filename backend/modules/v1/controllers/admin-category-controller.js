import db from "../../../config/db.js";
import dbHelper from "../../../config/dbHelper.js";
import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import {
    isPositiveInt,
    slugify,
    parseListingQuery,
    validateCategoryBody,
    validateSubCategoryBody,
    validateStatusBody,
} from "../validators/admin-category-validation.js";

// slug has a global UNIQUE index (not scoped by is_delete), so a soft-deleted
// row with the same slug would still collide at the DB level — check across
// all rows up front and surface a clean error instead of a raw ER_DUP_ENTRY.
async function isSlugTaken(table, slug, excludeId = null) {
    const sql = excludeId
        ? `SELECT id FROM ${table} WHERE slug = ? AND id != ? LIMIT 1`
        : `SELECT id FROM ${table} WHERE slug = ? LIMIT 1`;
    const params = excludeId ? [slug, excludeId] : [slug];
    const [rows] = await db.query(sql, params);
    return rows.length > 0;
}

function toBool01(value) {
    return Number(value) ? 1 : 0;
}

// ---------------- Category ----------------

const createCategory = async (req, res) => {
    try {
        const error = validateCategoryBody(req.body, { requireName: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const name = String(req.body.name).trim();
        const slug = req.body.slug ? slugify(req.body.slug, 80) : slugify(name, 80);
        if (!slug) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid slug could not be derived from name", null);
        }
        if (await isSlugTaken("categories", slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A category with this slug already exists", null);
        }

        const [result] = await dbHelper.insertQuery("categories", {
            name,
            slug,
            description: req.body.description ? String(req.body.description).trim() : null,
            image_url: req.body.image_url ? String(req.body.image_url).trim() : null,
            is_featured: req.body.is_featured !== undefined ? toBool01(req.body.is_featured) : 0,
        });

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Category created successfully", { id: result.insertId, name, slug });
    } catch (error) {
        console.error("Admin create category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getCategories = async (req, res) => {
    try {
        const { page, limit, offset, search, status } = parseListingQuery(req.query);

        const conditions = ["is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(name LIKE ? OR slug LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like);
        }
        if (status !== null) {
            conditions.push("is_active = ?");
            params.push(status);
        }
        const whereClause = conditions.join(" AND ");

        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM categories WHERE ${whereClause}`, params);

        const [rows] = await db.query(
            `SELECT id, name, slug, description, image_url, is_featured, is_active, created_at, updated_at
             FROM categories WHERE ${whereClause}
             ORDER BY created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Categories fetched successfully", rows, {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Admin get categories error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        const [rows] = await db.query(
            `SELECT id, name, slug, description, image_url, is_featured, is_active, created_at, updated_at
             FROM categories WHERE id = ? AND is_delete = 0 LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Category fetched successfully", rows[0]);
    } catch (error) {
        console.error("Admin get category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }
        const error = validateCategoryBody(req.body, { requireName: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const [existingRows] = await db.query("SELECT id FROM categories WHERE id = ? AND is_delete = 0 LIMIT 1", [id]);
        if (existingRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        const name = String(req.body.name).trim();
        const slug = req.body.slug ? slugify(req.body.slug, 80) : slugify(name, 80);
        if (!slug) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid slug could not be derived from name", null);
        }
        if (await isSlugTaken("categories", slug, id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A category with this slug already exists", null);
        }

        await dbHelper.updateQuery(
            "categories",
            {
                name,
                slug,
                description: req.body.description ? String(req.body.description).trim() : null,
                image_url: req.body.image_url ? String(req.body.image_url).trim() : null,
                is_featured: req.body.is_featured !== undefined ? toBool01(req.body.is_featured) : 0,
            },
            "id = ?",
            [id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Category updated successfully", { id: Number(id), name, slug });
    } catch (error) {
        console.error("Admin update category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }
        const error = validateStatusBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const is_active = toBool01(req.body.is_active);
        const [result] = await db.query("UPDATE categories SET is_active = ? WHERE id = ? AND is_delete = 0", [is_active, id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Category status updated", { id: Number(id), is_active: !!is_active });
    } catch (error) {
        console.error("Admin update category status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        const [result] = await db.query("UPDATE categories SET is_delete = 1, is_active = 0 WHERE id = ? AND is_delete = 0", [id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Category deleted successfully", null);
    } catch (error) {
        console.error("Admin delete category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

// ---------------- Sub-category ----------------

async function getActiveCategory(category_id) {
    const [rows] = await db.query("SELECT id FROM categories WHERE id = ? AND is_delete = 0 LIMIT 1", [category_id]);
    return rows[0] || null;
}

const createSubCategory = async (req, res) => {
    try {
        const error = validateSubCategoryBody(req.body, { requireName: true, requireCategory: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const category_id = Number(req.body.category_id);
        if (!(await getActiveCategory(category_id))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        const name = String(req.body.name).trim();
        const slug = req.body.slug ? slugify(req.body.slug, 80) : slugify(name, 80);
        if (!slug) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid slug could not be derived from name", null);
        }
        if (await isSlugTaken("sub_categories", slug)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A sub-category with this slug already exists", null);
        }

        const [result] = await dbHelper.insertQuery("sub_categories", {
            category_id,
            name,
            slug,
            description: req.body.description ? String(req.body.description).trim() : null,
            image_url: req.body.image_url ? String(req.body.image_url).trim() : null,
            is_featured: req.body.is_featured !== undefined ? toBool01(req.body.is_featured) : 0,
        });

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Sub-category created successfully", { id: result.insertId, category_id, name, slug });
    } catch (error) {
        console.error("Admin create sub-category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getSubCategories = async (req, res) => {
    try {
        const { page, limit, offset, search, status } = parseListingQuery(req.query);

        const conditions = ["sc.is_delete = 0"];
        const params = [];
        if (search) {
            conditions.push("(sc.name LIKE ? OR sc.slug LIKE ?)");
            const like = `%${search}%`;
            params.push(like, like);
        }
        if (status !== null) {
            conditions.push("sc.is_active = ?");
            params.push(status);
        }
        if (req.query.category_id && isPositiveInt(req.query.category_id)) {
            conditions.push("sc.category_id = ?");
            params.push(Number(req.query.category_id));
        }
        const whereClause = conditions.join(" AND ");

        const [[{ total }]] = await db.query(
            `SELECT COUNT(*) AS total FROM sub_categories sc WHERE ${whereClause}`,
            params
        );

        const [rows] = await db.query(
            `SELECT sc.id, sc.category_id, c.name AS category_name, sc.name, sc.slug, sc.description,
                    sc.image_url, sc.is_featured, sc.is_active, sc.created_at, sc.updated_at
             FROM sub_categories sc
             JOIN categories c ON c.id = sc.category_id
             WHERE ${whereClause}
             ORDER BY sc.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Sub-categories fetched successfully", rows, {
            current_page: page,
            per_page: limit,
            total,
            total_pages: total > 0 ? Math.ceil(total / limit) : 0,
        });
    } catch (error) {
        console.error("Admin get sub-categories error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const getSubCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        const [rows] = await db.query(
            `SELECT sc.id, sc.category_id, c.name AS category_name, sc.name, sc.slug, sc.description,
                    sc.image_url, sc.is_featured, sc.is_active, sc.created_at, sc.updated_at
             FROM sub_categories sc
             JOIN categories c ON c.id = sc.category_id
             WHERE sc.id = ? AND sc.is_delete = 0 LIMIT 1`,
            [id]
        );
        if (rows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Sub-category fetched successfully", rows[0]);
    } catch (error) {
        console.error("Admin get sub-category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }
        const error = validateSubCategoryBody(req.body, { requireName: true, requireCategory: true });
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const [existingRows] = await db.query("SELECT id FROM sub_categories WHERE id = ? AND is_delete = 0 LIMIT 1", [id]);
        if (existingRows.length === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        const category_id = Number(req.body.category_id);
        if (!(await getActiveCategory(category_id))) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Category not found", null);
        }

        const name = String(req.body.name).trim();
        const slug = req.body.slug ? slugify(req.body.slug, 80) : slugify(name, 80);
        if (!slug) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "A valid slug could not be derived from name", null);
        }
        if (await isSlugTaken("sub_categories", slug, id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_ERROR, "A sub-category with this slug already exists", null);
        }

        await dbHelper.updateQuery(
            "sub_categories",
            {
                category_id,
                name,
                slug,
                description: req.body.description ? String(req.body.description).trim() : null,
                image_url: req.body.image_url ? String(req.body.image_url).trim() : null,
                is_featured: req.body.is_featured !== undefined ? toBool01(req.body.is_featured) : 0,
            },
            "id = ?",
            [id]
        );

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Sub-category updated successfully", { id: Number(id), category_id, name, slug });
    } catch (error) {
        console.error("Admin update sub-category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const updateSubCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }
        const error = validateStatusBody(req.body);
        if (error) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, error, null);
        }

        const is_active = toBool01(req.body.is_active);
        const [result] = await db.query("UPDATE sub_categories SET is_active = ? WHERE id = ? AND is_delete = 0", [is_active, id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Sub-category status updated", { id: Number(id), is_active: !!is_active });
    } catch (error) {
        console.error("Admin update sub-category status error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

const deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isPositiveInt(id)) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        const [result] = await db.query("UPDATE sub_categories SET is_delete = 1, is_active = 0 WHERE id = ? AND is_delete = 0", [id]);
        if (result.affectedRows === 0) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.NO_DATA_FOUND, "Sub-category not found", null);
        }

        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Sub-category deleted successfully", null);
    } catch (error) {
        console.error("Admin delete sub-category error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export {
    createCategory,
    getCategories,
    getCategoryById,
    updateCategory,
    updateCategoryStatus,
    deleteCategory,
    createSubCategory,
    getSubCategories,
    getSubCategoryById,
    updateSubCategory,
    updateSubCategoryStatus,
    deleteSubCategory,
};
