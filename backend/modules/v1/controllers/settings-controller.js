import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import {
    ANNOUNCEMENT_MAX_LENGTH,
    getPublicSettings,
    normalizeWhatsappNumber,
    setSetting,
    setWhatsappNumber,
} from "../services/store-settings.js";

/** GET /settings (storefront) and GET /admin/settings — the store's WhatsApp number and top banner text. */
const getSettings = async (_req, res) => {
    try {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Settings fetched successfully", await getPublicSettings());
    } catch (error) {
        console.error("Get settings error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

/**
 * PUT /admin/settings — any of { "whatsapp_number": "6353684881" (any common Indian mobile format),
 * "announcement_text": "FREE Delivery Across India" (empty hides the banner) }. Fields left out keep their value.
 */
const updateSettings = async (req, res) => {
    try {
        const { whatsapp_number, announcement_text } = req.body || {};
        if (whatsapp_number === undefined && announcement_text === undefined) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Nothing to save", null);
        }

        const number = whatsapp_number === undefined ? null : normalizeWhatsappNumber(whatsapp_number);
        if (whatsapp_number !== undefined && !number) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Enter a valid 10-digit Indian mobile number", null);
        }
        const announcement = announcement_text === undefined ? null : String(announcement_text ?? "").trim();
        if (announcement !== null && announcement.length > ANNOUNCEMENT_MAX_LENGTH) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, `Keep the banner text to ${ANNOUNCEMENT_MAX_LENGTH} characters or fewer`, null);
        }

        if (number) await setWhatsappNumber(number);
        if (announcement !== null) await setSetting("announcement_text", announcement);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Settings saved", await getPublicSettings());
    } catch (error) {
        console.error("Update settings error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { getSettings, updateSettings };
