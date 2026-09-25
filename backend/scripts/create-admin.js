// Creates an admin account, or resets an existing admin's password.
//   npm run admin:create -- "Your Name" you@example.com 'Str0ng!Password'
// The password must meet the same rules as customer passwords.
import bcrypt from "bcryptjs";
import db from "../config/db.js";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function main() {
    const [name, rawEmail, password] = process.argv.slice(2);
    const email = String(rawEmail || "").trim().toLowerCase();

    if (!name || !email || !password) {
        throw new Error('Usage: npm run admin:create -- "Full Name" email@example.com \'Password@123\'');
    }
    if (!EMAIL_REGEX.test(email)) throw new Error("Enter a valid email address");
    if (!PASSWORD_REGEX.test(password)) {
        throw new Error("Password must be 8+ characters with an uppercase letter, a lowercase letter, a number and a special character");
    }

    const hash = await bcrypt.hash(password, 10);
    const [existing] = await db.query("SELECT id FROM admins WHERE email = ? LIMIT 1", [email]);

    if (existing.length > 0) {
        await db.query("UPDATE admins SET name = ?, password_hash = ?, is_active = 1, is_delete = 0 WHERE id = ?", [name.trim(), hash, existing[0].id]);
        // Old sessions stop working once the password changes.
        await db.query("UPDATE user_devices SET is_active = 0 WHERE user_id = ? AND role = 'admin'", [existing[0].id]);
        console.log(`✓ Updated admin ${email} — password reset, old sessions signed out`);
    } else {
        await db.query("INSERT INTO admins (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')", [name.trim(), email, hash]);
        console.log(`✓ Created admin ${email}`);
    }
    console.log("  Sign in at /login with this email to open /admin.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(`✗ ${error.message}`);
        process.exit(1);
    });
