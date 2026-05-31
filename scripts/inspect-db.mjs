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

const schemas = await c.query(
  "select schema_name from information_schema.schemata where schema_name like 'promptcontrol%' order by schema_name"
);
console.log("\n== Schemas ==");
console.table(schemas.rows);

const tables = await c.query(
  "select table_schema, table_name from information_schema.tables where table_schema like 'promptcontrol%' order by table_schema, table_name"
);
console.log("\n== Tables ==");
console.table(tables.rows);

const user = await c.query(
  "select id, email from auth.users where email = 'nikolaj.schefner@wamocon.com'"
);
console.log("\n== Admin user ==");
console.table(user.rows);

if (user.rows.length > 0) {
  const userId = user.rows[0].id;
  for (const schema of ["promptcontrol_dev", "promptcontrol_test", "promptcontrol_prod"]) {
    try {
      const profile = await c.query(
        `select p.id, p.user_id, p.email, p.role, p.org_id, o.name as org_name, o.plan from ${schema}.profiles p left join ${schema}.organizations o on o.id = p.org_id where p.user_id = $1`,
        [userId]
      );
      console.log(`\n== ${schema}.profiles for admin ==`);
      console.table(profile.rows);
    } catch (e) {
      console.log(`\n== ${schema}: ERROR ${e.message} ==`);
    }
  }
}

await c.end();
