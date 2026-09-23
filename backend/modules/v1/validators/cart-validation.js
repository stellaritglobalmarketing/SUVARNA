function isPositiveInt(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0;
}

function validateAddToCart(body) {
    const { product_variant_id, quantity } = body || {};

    if (!isPositiveInt(product_variant_id)) {
        return "product_variant_id is required and must be a valid positive integer";
    }
    if (!isPositiveInt(quantity)) {
        return "quantity is required and must be greater than 0";
    }

    return null;
}

function validateUpdateQuantity(body) {
    const { quantity } = body || {};

    if (!isPositiveInt(quantity)) {
        return "quantity is required and must be greater than 0";
    }

    return null;
}

export { validateAddToCart, validateUpdateQuantity, isPositiveInt };
