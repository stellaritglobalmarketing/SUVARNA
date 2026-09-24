// Validation for PUT /admin/product/:id/content. Every section is optional; a section that is
// present replaces that product's whole list (send [] to clear it). Limits mirror the columns.

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

function text(value) {
    return value === undefined || value === null ? "" : String(value).trim();
}

function checkList(value, name, max) {
    if (!Array.isArray(value)) {
        return `${name} must be an array`;
    }
    if (value.length > max) {
        return `${name} can have at most ${max} items`;
    }
    return null;
}

function checkUniqueLabels(items, name) {
    const seen = new Set();
    for (const item of items) {
        const key = item.label.toLowerCase();
        if (seen.has(key)) {
            return `${name} has "${item.label}" more than once`;
        }
        seen.add(key);
    }
    return null;
}

function parseNutrients(value) {
    const listError = checkList(value, "nutrients", 30);
    if (listError) return { error: listError };

    const items = [];
    for (const [i, raw] of value.entries()) {
        const label = text(raw?.label);
        const valuePer100g = text(raw?.value_per_100g);
        const dv = raw?.daily_value_percent;
        if (!label || label.length > 64) return { error: `nutrients[${i}].label is required (max 64 characters)` };
        if (!valuePer100g || valuePer100g.length > 32) return { error: `nutrients[${i}].value_per_100g is required (max 32 characters), e.g. "21.2 g"` };
        let dailyValue = null;
        if (dv !== undefined && dv !== null && dv !== "") {
            dailyValue = Number(dv);
            if (!Number.isInteger(dailyValue) || dailyValue < 0 || dailyValue > 65535) {
                return { error: `nutrients[${i}].daily_value_percent must be a whole number ≥ 0` };
            }
        }
        items.push({ label, value_per_100g: valuePer100g, daily_value_percent: dailyValue });
    }
    const dupError = checkUniqueLabels(items, "nutrients");
    return dupError ? { error: dupError } : { items };
}

function parseLipidProfile(value) {
    const listError = checkList(value, "lipid_profile", 10);
    if (listError) return { error: listError };

    const items = [];
    for (const [i, raw] of value.entries()) {
        const label = text(raw?.label);
        const percent = Number(raw?.percent);
        const color = text(raw?.color);
        if (!label || label.length > 32) return { error: `lipid_profile[${i}].label is required (max 32 characters)` };
        if (!Number.isFinite(percent) || percent < 0 || percent > 100) return { error: `lipid_profile[${i}].percent must be between 0 and 100` };
        if (!HEX_COLOR_REGEX.test(color)) return { error: `lipid_profile[${i}].color must be a hex colour like #23412e` };
        items.push({ label, percent, color: color.toLowerCase() });
    }
    const total = items.reduce((sum, item) => sum + item.percent, 0);
    if (total > 100.5) {
        return { error: `lipid_profile percentages add up to ${total}, more than 100` };
    }
    const dupError = checkUniqueLabels(items, "lipid_profile");
    return dupError ? { error: dupError } : { items };
}

function parseCertifications(value) {
    const listError = checkList(value, "certifications", 20);
    if (listError) return { error: listError };

    const items = [];
    for (const [i, raw] of value.entries()) {
        const label = text(raw?.label);
        const description = text(raw?.description);
        if (!label || label.length > 64) return { error: `certifications[${i}].label is required (max 64 characters)` };
        if (description.length > 255) return { error: `certifications[${i}].description must be 255 characters or fewer` };
        items.push({ label, description: description || null });
    }
    const dupError = checkUniqueLabels(items, "certifications");
    return dupError ? { error: dupError } : { items };
}

function parseHealthBenefits(value) {
    const listError = checkList(value, "health_benefits", 20);
    if (listError) return { error: listError };

    const items = [];
    for (const [i, raw] of value.entries()) {
        const benefit = text(raw);
        if (!benefit || benefit.length > 64) return { error: `health_benefits[${i}] must be 1–64 characters` };
        if (!items.some((existing) => existing.toLowerCase() === benefit.toLowerCase())) {
            items.push(benefit);
        }
    }
    return { items };
}

function parseStorageTips(value) {
    if (value === null) {
        return { tips: null };
    }
    if (typeof value !== "object" || Array.isArray(value)) {
        return { error: "storage_tips must be an object like { shelf_life, storage, usage } or null" };
    }
    const tips = {
        shelf_life_tip: text(value.shelf_life) || null,
        storage_tip: text(value.storage) || null,
        usage_tip: text(value.usage) || null,
    };
    for (const [key, tip] of Object.entries(tips)) {
        if (tip && tip.length > 255) {
            return { error: `storage_tips.${key.replace("_tip", "")} must be 255 characters or fewer` };
        }
    }
    const isEmpty = !tips.shelf_life_tip && !tips.storage_tip && !tips.usage_tip;
    return { tips: isEmpty ? null : tips };
}

function parseRelatedIds(value) {
    const listError = checkList(value, "related_product_ids", 12);
    if (listError) return { error: listError };

    const ids = [];
    for (const [i, raw] of value.entries()) {
        const id = Number(raw);
        if (!Number.isInteger(id) || id <= 0) return { error: `related_product_ids[${i}] must be a product id` };
        if (!ids.includes(id)) ids.push(id);
    }
    return { ids };
}

/** Returns { error } or { content } holding only the sections present in the body. */
function parseProductContent(body = {}) {
    const content = {};
    const sections = [
        ["nutrients", parseNutrients, "items"],
        ["lipid_profile", parseLipidProfile, "items"],
        ["certifications", parseCertifications, "items"],
        ["health_benefits", parseHealthBenefits, "items"],
        ["storage_tips", parseStorageTips, "tips"],
        ["related_product_ids", parseRelatedIds, "ids"],
    ];

    for (const [key, parse, field] of sections) {
        if (body[key] === undefined) continue;
        const result = parse(body[key]);
        if (result.error) return { error: result.error };
        content[key] = result[field];
    }

    if (Object.keys(content).length === 0) {
        return { error: `Send at least one of: ${sections.map(([key]) => key).join(", ")}` };
    }
    return { content };
}

export { parseProductContent };
