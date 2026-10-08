// Product information sections ("The Science Within", "How to Use", "Storage", …) shown on the
// product page. Stored in product_info_sections; `items` is a JSON array of { label, text }.

function parseItems(raw) {
    if (!raw) return [];
    try {
        const items = JSON.parse(raw);
        return Array.isArray(items)
            ? items.filter((item) => item && item.text).map((item) => ({ label: item.label || null, text: item.text }))
            : [];
    } catch {
        return [];
    }
}

/** A product's sections in display order: [{ title, body, items: [{ label, text }] }]. */
export async function loadInfoSections(conn, productId) {
    const [rows] = await conn.query(
        "SELECT title, body, items FROM product_info_sections WHERE product_id = ? ORDER BY sort_order ASC, id ASC",
        [productId]
    );
    return rows.map((row) => ({ title: row.title, body: row.body || null, items: parseItems(row.items) }));
}

/** Replaces a product's sections (already validated) inside the caller's transaction. */
export async function replaceInfoSections(conn, productId, sections) {
    await conn.query("DELETE FROM product_info_sections WHERE product_id = ?", [productId]);
    if (sections.length > 0) {
        await conn.query("INSERT INTO product_info_sections (product_id, title, body, items, sort_order) VALUES ?", [
            sections.map((section, i) => [
                productId,
                section.title,
                section.body || null,
                section.items.length > 0 ? JSON.stringify(section.items) : null,
                i + 1,
            ]),
        ]);
    }
}
