const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"];
const FULFILLMENT_STATUSES = ["unfulfilled", "processing", "fulfilled"];

// pending -> confirmed -> processing -> shipped -> delivered, with cancellation
// only reachable before the order has actually shipped (a shipped/delivered
// order needs a real return/refund flow, not a plain status flip).
const ORDER_STATUS_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
};

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidOrderNumber(orderNumber) {
    return typeof orderNumber === "string" && /^ORD-\d{8}-\d+$/.test(orderNumber.trim());
}

function isValidTransition(currentStatus, nextStatus) {
    return (ORDER_STATUS_TRANSITIONS[currentStatus] || []).includes(nextStatus);
}

function parseOrderListingQuery(query = {}) {
    let page = parseInt(query.page, 10);
    if (!Number.isInteger(page) || page < 1) {
        page = 1;
    }

    let limit = parseInt(query.limit, 10);
    if (!Number.isInteger(limit) || limit < 1) {
        limit = DEFAULT_LIMIT;
    }
    if (limit > MAX_LIMIT) {
        limit = MAX_LIMIT;
    }

    const search = query.search ? String(query.search).trim().slice(0, 100) : null;
    const order_status = ORDER_STATUSES.includes(query.order_status) ? query.order_status : null;
    const payment_status = PAYMENT_STATUSES.includes(query.payment_status) ? query.payment_status : null;
    const fulfillment_status = FULFILLMENT_STATUSES.includes(query.fulfillment_status) ? query.fulfillment_status : null;
    const date_from = DATE_REGEX.test(query.date_from) ? query.date_from : null;
    const date_to = DATE_REGEX.test(query.date_to) ? query.date_to : null;

    return { page, limit, offset: (page - 1) * limit, search, order_status, payment_status, fulfillment_status, date_from, date_to };
}

function validateStatusUpdateBody(body) {
    const { order_status, payment_status, fulfillment_status } = body || {};

    if (order_status === undefined && payment_status === undefined && fulfillment_status === undefined) {
        return "At least one of order_status, payment_status or fulfillment_status is required";
    }
    if (order_status !== undefined && !ORDER_STATUSES.includes(order_status)) {
        return `order_status must be one of: ${ORDER_STATUSES.join(", ")}`;
    }
    if (payment_status !== undefined && !PAYMENT_STATUSES.includes(payment_status)) {
        return `payment_status must be one of: ${PAYMENT_STATUSES.join(", ")}`;
    }
    if (fulfillment_status !== undefined && !FULFILLMENT_STATUSES.includes(fulfillment_status)) {
        return `fulfillment_status must be one of: ${FULFILLMENT_STATUSES.join(", ")}`;
    }

    return null;
}

export {
    ORDER_STATUSES,
    PAYMENT_STATUSES,
    FULFILLMENT_STATUSES,
    isValidOrderNumber,
    isValidTransition,
    parseOrderListingQuery,
    validateStatusUpdateBody,
};
