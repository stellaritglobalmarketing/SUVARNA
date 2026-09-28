// Validation for PUT /admin/product/:id/content. Every section is optional; a section that is
// present replaces that product's whole list (send [] to clear it). Limits mirror the columns.

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
        ["certifications", parseCertifications, "items"],
        ["health_benefits", parseHealthBenefits, "items"],
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
