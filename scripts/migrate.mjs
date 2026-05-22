// @ts-check
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";
import pkg from "pg";
const { Client } = pkg;

// Load environment variables from .env.local
config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env.local") });

const __dirname = dirname(fileURLToPath(import.meta.url));

if (!process.env.SUPABASE_DB_URL) {
  console.error("Error: SUPABASE_DB_URL is not set in .env.local");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  await client.connect();
  console.log("Connected to Supabase PostgreSQL");

  const sql = readFileSync(
    join(__dirname, "../supabase/migrations/20260522000001_initial_schema.sql"),
    "utf8"
  );

  try {
    await client.query(sql);
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
