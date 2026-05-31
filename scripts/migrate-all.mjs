// @ts-check
// Apply all pending migrations in supabase/migrations/ in lexicographic order.
// Tracks applied migrations in public.schema_migrations to be idempotent.
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import pkg from "pg";

const { Client } = pkg;
config({ path: ".env.local" });

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "../supabase/migrations");

if (!process.env.SUPABASE_DB_URL) {
  console.error("Error: SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

const force = process.argv.includes("--force");

await client.connect();
console.log("Connected to Supabase PostgreSQL");

await client.query(`
  CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`);

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const { rows: applied } = await client.query(
  "SELECT version FROM public.schema_migrations"
);
const appliedSet = new Set(applied.map((r) => r.version));

let appliedCount = 0;
let skippedCount = 0;
let failedFile = null;

for (const file of files) {
  const version = file.replace(/\.sql$/, "");
  if (appliedSet.has(version) && !force) {
    console.log(`SKIP  ${file} (already applied)`);
    skippedCount++;
    continue;
  }
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  process.stdout.write(`APPLY ${file} ... `);
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT (version) DO UPDATE SET applied_at = now()",
      [version]
    );
    await client.query("COMMIT");
    console.log("OK");
    appliedCount++;
  } catch (err) {
    await client.query("ROLLBACK");
    console.log("FAILED");
    console.error(`\n  -> ${err.message}\n`);
    failedFile = file;
    break;
  }
}

await client.end();

console.log(`\n=== Summary ===`);
console.log(`Applied: ${appliedCount}`);
console.log(`Skipped: ${skippedCount}`);
if (failedFile) {
  console.log(`FAILED at: ${failedFile}`);
  process.exit(1);
}
console.log("All migrations up-to-date.");
