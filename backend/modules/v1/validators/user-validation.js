const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
// Min 8 chars, at least one uppercase, one lowercase, one digit, one special character.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

// Accepts the ways people actually type an Indian mobile number — "+91 98765 43210",
// "098765-43210", "919876543210" — and reduces it to the 10 digits stored in users.phone.
// Anything that isn't purely a number is returned trimmed and unchanged (e.g. an email).
function normalizePhone(value) {
    const raw = String(value ?? "").trim();
    const digits = raw.replace(/[\s\-()]/g, "").replace(/^\+/, "");
    if (!/^\d+$/.test(digits)) {
        return raw;
    }
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }
    if (digits.length === 11 && digits.startsWith("0")) {
        return digits.slice(1);
    }
    return digits;
}

function validateSignup(body) {
    const { name, email, phone, password } = body || {};

    if (!name || !String(name).trim()) {
        return "Name is required";
    }
    if (String(name).trim().length > 64) {
        return "Name must be 64 characters or fewer";
    }
    if (!phone || !String(phone).trim()) {
        return "Phone number is required";
    }
    if (!PHONE_REGEX.test(normalizePhone(phone))) {
        return "Enter a valid 10-digit phone number";
    }
    if (email && !EMAIL_REGEX.test(String(email).trim())) {
        return "Enter a valid email address";
    }
    if (email && String(email).trim().length > 128) {
        return "Email must be 128 characters or fewer";
    }
    if (!password || typeof password !== "string") {
        return "Password is required";
    }
    if (!PASSWORD_REGEX.test(password)) {
        return "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character";
    }

    return null;
}

function validateLogin(body) {
    const { login, password } = body || {};

    if (!login || !String(login).trim()) {
        return "Email or phone number is required";
    }
    if (!password || typeof password !== "string") {
        return "Password is required";
    }

    return null;
}

export { validateSignup, validateLogin, normalizePhone };
