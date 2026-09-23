const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
// Min 8 chars, at least one uppercase, one lowercase, one digit, one special character.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function validateSignup(body) {
    const { name, email, phone, password } = body || {};

    if (!name || !String(name).trim()) {
        return "Name is required";
    }
    if (!phone || !String(phone).trim()) {
        return "Phone number is required";
    }
    if (!PHONE_REGEX.test(String(phone).trim())) {
        return "Enter a valid 10-digit phone number";
    }
    if (email && !EMAIL_REGEX.test(String(email).trim())) {
        return "Enter a valid email address";
    }
    if (!password) {
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
    if (!password) {
        return "Password is required";
    }

    return null;
}

export { validateSignup, validateLogin };
