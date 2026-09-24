import mysql from "mysql2/promise";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

// Aiven (and most managed MySQL providers) require SSL. The CA certificate can come from
// either an environment variable holding the certificate text directly (DB_SSL_CA — the
// only practical option on Render, which has no persistent filesystem to upload a .pem to)
// or a local file path (DB_SSL_CA_PATH — convenient for local development).
function loadSslCa() {
  const inlineCert = process.env.DB_SSL_CA;
  if (inlineCert && inlineCert.trim()) {
    // Render's dashboard stores multi-line env vars fine, but if the cert was ever pasted
    // as a single line with literal "\n" sequences, un-escape them before use.
    return inlineCert.includes("\\n") ? inlineCert.replace(/\\n/g, "\n") : inlineCert;
  }
  const certPath = process.env.DB_SSL_CA_PATH;
  if (certPath && certPath.trim()) {
    return fs.readFileSync(certPath, "utf8");
  }
  return null;
}

const sslCa = loadSslCa();
// Local dev against Aiven without a CA cert on hand: still enable TLS (Aiven requires it),
// just without verifying the certificate chain. Production should keep using DB_SSL_CA.
const sslOption = sslCa ? { ca: sslCa } : /aivencloud\.com/.test(process.env.DB_HOST || "") ? { rejectUnauthorized: false } : null;

// Shared by the pool below and by scripts that need their own connection (e.g. the migration runner).
export const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "pujara_print_n_pack",
  // Some hosts (Render included) resolve a DB provider's hostname to an IPv6 address that
  // isn't actually routable outbound, which hangs until it times out instead of failing fast.
  // Forcing IPv4 avoids that class of ETIMEDOUT.
  family: 4,
  connectTimeout: 15000,
  ...(sslOption ? { ssl: sslOption } : {}),
};

// Create a connection pool for better performance and reliability under production load.
const db = mysql.createPool({
  ...connectionConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Without this, a dropped pooled connection (DB-side idle timeout, network blip,
// etc.) emits an 'error' event with no listener attached — Node treats that as
// an unhandled error and crashes the whole process, regardless of any
// try/catch in request handlers. This keeps that failure contained to a log line;
// mysql2 discards the dead connection and opens a fresh one on the next query.
db.on("error", (error) => {
  console.error(`✗ MySQL pool error [${error.code || "?"}]:`, error.message);
});

// Fail fast and loudly if the pool can't actually reach the database — much easier to
// debug at boot time than on the first request that happens to touch the DB.
db.getConnection()
  .then(connection => {
    console.log(`✓ MySQL pool connected (${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || "pujara_print_n_pack"})`);
    connection.release();
  })
  .catch(error => {
    console.error(`✗ MySQL pool failed to connect [${error.code || "?"}]:`, error.message);
  });

export default db;
