import PDFDocument from "pdfkit";

// Stand-in for the Ekart API while the account can't book real parcels (EKART_MOCK=true).
// Every function returns the same shape as the real endpoint in config/ekart.js, so the rest of the
// shipping code (booking, labels, tracking sync, order statuses) runs unchanged. Nothing leaves the server.
//
// Tracking ids look like MOCK<creation time in ms>. A mock parcel moves one tracking step every
// EKART_MOCK_STEP_MINUTES (default 2) after it's booked, ending at Delivered; press Sync to see it.
//
// To try the failure paths:
//   delivery pincode starting with 9  → "not serviceable" (serviceability and booking)
//   EKART_MOCK_FAIL=wallet            → booking fails with a low-wallet-balance error

const STEPS = [
    { status: "Order Placed", desc: "Shipment created", location: null },
    { status: "Pickup Scheduled", desc: "Pickup scheduled from seller", location: null },
    { status: "Picked Up", desc: "Shipment picked up", location: "Origin hub" },
    { status: "In Transit", desc: "Shipment in transit", location: "Sorting centre" },
    { status: "Out for Delivery", desc: "Out for delivery", location: "Destination hub" },
    { status: "Delivered", desc: "Delivered to customer", location: "Destination" },
];

const cancelled = new Set(); // in memory only: after a restart a mock cancel is forgotten (the DB keeps it)
const webhooks = [];
const addresses = []; // mock pickup addresses, in memory only (gone after a restart)

function stepMs() {
    const minutes = Number(process.env.EKART_MOCK_STEP_MINUTES);
    return (Number.isFinite(minutes) && minutes > 0 ? minutes : 2) * 60 * 1000;
}

function mockError(message, status = 400) {
    const error = new Error(`Ekart (mock): ${message}`);
    error.status = status;
    error.ekart = { status: false, remark: message };
    return error;
}

const unserviceable = (pincode) => String(pincode).trim().startsWith("9");

function createdAt(trackingId) {
    const match = /^MOCK(\d{13})$/.exec(String(trackingId));
    return match ? Number(match[1]) : null;
}

function round2(value) {
    return Math.round(Number(value) * 100) / 100;
}

const ekartMock = {
    createShipment: async (payload) => {
        if (process.env.EKART_MOCK_FAIL === "wallet") {
            throw mockError("Insufficient wallet balance. Please recharge your wallet to create shipments.");
        }
        const pin = payload?.drop_location?.pin;
        if (unserviceable(pin)) {
            throw mockError(`Pincode ${pin} is not serviceable`);
        }
        const trackingId = `MOCK${Date.now()}`;
        return {
            status: true,
            remark: "Mock shipment created",
            tracking_id: trackingId,
            vendor: "Ekart (mock)",
            barcodes: { wbn: trackingId, order: payload?.order_number ?? null, cod: null },
        };
    },

    cancelShipment: async (trackingId) => {
        const start = createdAt(trackingId);
        if (start === null) throw mockError(`Unknown tracking id ${trackingId}`, 404);
        if (Date.now() - start >= 2 * stepMs()) throw mockError("Shipment is already picked up and can't be cancelled");
        cancelled.add(trackingId);
        return { data: [{ status: true, remark: "Mock shipment cancelled", tracking_id: trackingId }] };
    },

    track: async (trackingId) => {
        const start = createdAt(trackingId);
        if (start === null) throw mockError(`Unknown tracking id ${trackingId}`, 404);
        const reached = Math.min(Math.floor((Date.now() - start) / stepMs()), STEPS.length - 1);
        const details = STEPS.slice(0, reached + 1).map((step, i) => ({ ...step, ctime: start + i * stepMs() }));
        if (cancelled.has(trackingId)) {
            details.push({ status: "Seller Cancelled", desc: "Cancelled by seller", location: null, ctime: Date.now() });
        }
        const last = details[details.length - 1];
        return {
            _id: trackingId,
            order_number: null,
            edd: start + (STEPS.length - 1) * stepMs(),
            track: { ...last, pickupTime: reached >= 2 ? start + 2 * stepMs() : null, details: [...details].reverse() },
        };
    },

    serviceability: async (pincode) => {
        if (unserviceable(pincode)) {
            return { status: false, pincode, remark: "Pincode not serviceable (mock)", details: {} };
        }
        return {
            status: true,
            pincode,
            remark: "Serviceable (mock)",
            details: { cod: true, max_cod_amount: 50000, forward_drop: true, city: null, state: null },
        };
    },

    laneServiceability: async (body) => (unserviceable(body?.dropPincode) ? [] : [{ tat: { min: 2, max: 5 } }]),

    // Rough slab pricing so the numbers look plausible; real rates come from the Ekart contract.
    estimate: async (body) => {
        if (unserviceable(body?.dropPincode)) throw mockError(`Pincode ${body.dropPincode} is not serviceable`);
        const from = String(body?.pickupPincode ?? "");
        const to = String(body?.dropPincode ?? "");
        const zone = from.slice(0, 3) === to.slice(0, 3) ? "A" : from[0] === to[0] ? "B" : "D";
        const volumetric = (Number(body?.length) * Number(body?.width) * Number(body?.height)) / 5; // grams
        const billing = Math.max(Number(body?.weight) || 0, volumetric || 0, 500);
        const slabs = Math.ceil(billing / 500);
        const perSlab = { A: 30, B: 40, D: 55 }[zone];
        const shipping = perSlab * slabs;
        const fuel = round2(shipping * 0.1);
        const taxes = round2((shipping + fuel) * 0.18);
        return {
            zone,
            billingWeight: String(billing),
            volumetricWeight: String(round2(volumetric)),
            shippingCharge: String(shipping),
            fuelSurcharge: String(fuel),
            codCharge: "0",
            rtoCharge: String(shipping),
            taxes: String(taxes),
            total: String(round2(shipping + fuel + taxes)),
        };
    },

    downloadLabels: async (trackingIds) => {
        const doc = new PDFDocument({ size: [288, 432], margin: 20 }); // 4x6 inch
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        const done = new Promise((resolve) => doc.on("end", resolve));
        trackingIds.forEach((id, i) => {
            if (i > 0) doc.addPage();
            doc.fontSize(18).text("MOCK LABEL", { align: "center" });
            doc.moveDown().fontSize(10).text("Test only - not a real Ekart shipment.", { align: "center" });
            doc.moveDown(2).fontSize(14).text(`Tracking ID: ${id}`, { align: "center" });
        });
        doc.end();
        await done;
        return { buffer: Buffer.concat(chunks), contentType: "application/pdf" };
    },

    generateManifest: async () => ({ ctime: Date.now(), manifestNumber: `MOCKMF${Date.now()}`, manifestDownloadUrl: null }),

    ndrAction: async () => ({ status: true, remark: "Mock NDR action accepted" }),

    listAddresses: async () => addresses.map((a) => ({ ...a, geo: { ...a.geo } })),
    addAddress: async (body) => {
        if (addresses.some((a) => a.alias.toLowerCase() === String(body?.alias).toLowerCase())) {
            throw mockError(`An address with alias "${body.alias}" already exists`);
        }
        const address = { ...body, geo: body?.geo ?? { lat: 0, lon: 0 } };
        addresses.push(address);
        return address;
    },

    listWebhooks: async () => webhooks,
    addWebhook: async (body) => {
        const hook = { id: `mock-${webhooks.length + 1}`, ...body };
        webhooks.push(hook);
        return hook;
    },
    updateWebhook: async (id, body) => {
        const hook = webhooks.find((h) => h.id === id);
        if (hook) Object.assign(hook, body);
        return hook ?? null;
    },
};

export default ekartMock;
