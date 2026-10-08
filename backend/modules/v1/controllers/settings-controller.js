import middleware from "../../../middleware/middleware.js";
import Codes from "../../../config/status_codes.js";
import { getPublicSettings, normalizeWhatsappNumber, setWhatsappNumber } from "../services/store-settings.js";

/** GET /settings (storefront) and GET /admin/settings — the store's WhatsApp number. */
const getSettings = async (_req, res) => {
    try {
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Settings fetched successfully", await getPublicSettings());
    } catch (error) {
        console.error("Get settings error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

/** PUT /admin/settings — { "whatsapp_number": "6353684881" } (any common Indian mobile format). */
const updateSettings = async (req, res) => {
    try {
        const number = normalizeWhatsappNumber(req.body?.whatsapp_number);
        if (!number) {
            return middleware.sendResponse(res, Codes.SUCCESS, Codes.MISSING_FIELD, "Enter a valid 10-digit Indian mobile number", null);
        }
        await setWhatsappNumber(number);
        return middleware.sendResponse(res, Codes.SUCCESS, Codes.RESPONSE_SUCCESS, "Settings saved", await getPublicSettings());
    } catch (error) {
        console.error("Update settings error: ", error);
        return middleware.sendResponse(res, Codes.INTERNAL_ERROR, Codes.RESPONSE_ERROR, "Something went wrong. Please try again later", null);
    }
};

export { getSettings, updateSettings };
