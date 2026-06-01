// @ts-check
import { config } from "dotenv";
import pkg from "pg";
const { Client } = pkg;
config({ path: ".env.local" });

const c = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});
await c.connect();
await c.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations(version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
for (const v of [
  "20260522000001_initial_schema",
  "20260529000001_admin_settings",
  "20260531000001_sync_schemas_and_fix_rls",
  "20260531000002_seed_admin_pro",
]) {
  await c.query("INSERT INTO public.schema_migrations(version) VALUES($1) ON CONFLICT DO NOTHING", [v]);
  console.log("marked", v);
}
await c.end();
