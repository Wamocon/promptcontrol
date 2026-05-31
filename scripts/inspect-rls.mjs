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

for (const schema of ["promptcontrol_dev", "promptcontrol_test", "promptcontrol_prod"]) {
  console.log(`\n=== ${schema} ===`);
  const rls = await c.query(
    `select tablename, rowsecurity from pg_tables where schemaname = $1 order by tablename`,
    [schema]
  );
  console.table(rls.rows);

  const pol = await c.query(
    `select tablename, policyname, cmd, qual, with_check from pg_policies where schemaname = $1 order by tablename, policyname`,
    [schema]
  );
  console.log(`Policies in ${schema}:`, pol.rows.length);
  for (const row of pol.rows) {
    console.log(`  ${row.tablename}.${row.policyname} [${row.cmd}] qual=${row.qual} check=${row.with_check}`);
  }
}

// Check exposed schemas in PostgREST
const exposed = await c.query(
  `select name, setting from pg_settings where name like '%search_path%' or name like '%pgrst%'`
);
console.log("\n== Settings ==");
console.table(exposed.rows);

await c.end();
