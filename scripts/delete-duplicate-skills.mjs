// @ts-check
// Loescht die "-2"-Duplikate, die durch den urspruenglichen Import aus
// sowohl dem Top-Level- als auch dem Synced-Ordner entstanden sind
// (siehe audit-personal-refs-and-integrity.mjs, Abschnitt 3). Die
// jeweils erste (nicht-"-2") Version bleibt erhalten. skill_versions und
// skill_files sind per ON DELETE CASCADE an skills gebunden, werden also
// automatisch mit geloescht.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/delete-duplicate-skills.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

const DUPLICATE_SLUGS = [
  "project-management-agile-2",
  "breakdown-epic-pm-2",
  "breakdown-plan-2",
  "gstack-2",
  "create-specification-2",
  "memory-merger-2",
  "prd-2",
  "update-specification-2",
  "create-technical-spike-2",
  "update-implementation-plan-2",
  "wmc-vibecode-cleanup-2",
];

for (const slug of DUPLICATE_SLUGS) {
  const { data: skill } = await supabase.from("skills").select("id, name").eq("slug", slug).maybeSingle();
  if (!skill) {
    console.log(`ÜBERSPRUNGEN "${slug}": nicht gefunden (evtl. schon gelöscht).`);
    continue;
  }
  const { error } = await supabase.from("skills").delete().eq("id", skill.id);
  if (error) {
    console.error(`FEHLER bei "${slug}":`, error.message);
    continue;
  }
  console.log(`Gelöscht "${slug}" ("${skill.name}").`);
}
