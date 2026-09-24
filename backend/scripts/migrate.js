// Applies every database/migrations/*.sql file (in filename order) that hasn't been
// applied yet, recording each one in `schema_migrations`. Run with `npm run db:migrate`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { connectionConfig } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "database", "migrations");

async function migrate() {
    // Own connection (not the shared pool) because migration files hold several statements.
    const connection = await mysql.createConnection({ ...connectionConfig, multipleStatements: true });

    try {
        await connection.query(
            `CREATE TABLE IF NOT EXISTS schema_migrations (
                filename varchar(255) NOT NULL,
                applied_at timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (filename)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
        );

        const [appliedRows] = await connection.query("SELECT filename FROM schema_migrations");
        const applied = new Set(appliedRows.map((r) => r.filename));

        const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
        let count = 0;

        for (const file of files) {
            if (applied.has(file)) {
                continue;
            }
            const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
            console.log(`→ Applying ${file}`);
            await connection.query(sql);
            await connection.query("INSERT INTO schema_migrations (filename) VALUES (?)", [file]);
            count += 1;
        }

        console.log(count === 0 ? "✓ Database already up to date" : `✓ Applied ${count} migration(s)`);
    } finally {
        await connection.end();
    }
}

migrate()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("✗ Migration failed:", error.message);
        process.exit(1);
    });
