// @ts-check
// Read-only Audit: vergleicht bei jedem Skill die Zeicheanzahl direkt vor
// und nach dem ersten "KI-Aufbereitung"-Durchlauf. Eine starke Kuerzung
// kann auf Informationsverlust hindeuten (wie beim wmc-branding-Skill,
// wo ein eingebettetes Bild abgeschnitten wurde). Nimmt nichts an der
// Datenbank vor, gibt nur einen Bericht aus.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/audit-polish-shrinkage.mjs [Schwellwert-Prozent, Standard 35]

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";
const THRESHOLD_PCT = Number(process.argv[2] ?? 35);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

const { data: skills, error: skillsErr } = await supabase.from("skills").select("id, slug, name");
if (skillsErr) {
  console.error("Fehler:", skillsErr.message);
  process.exit(1);
}

const { data: versions, error: versionsErr } = await supabase
  .from("skill_versions")
  .select("skill_id, version, change_note, content")
  .order("skill_id")
  .order("version", { ascending: true });
if (versionsErr) {
  console.error("Fehler:", versionsErr.message);
  process.exit(1);
}

const bySkill = new Map();
for (const v of versions) {
  if (!bySkill.has(v.skill_id)) bySkill.set(v.skill_id, []);
  bySkill.get(v.skill_id).push(v);
}

const results = [];
for (const skill of skills) {
  const vs = bySkill.get(skill.id);
  if (!vs || vs.length < 2) continue;

  const polishIndex = vs.findIndex((v) => v.change_note === "KI-Aufbereitung");
  if (polishIndex <= 0) continue; // keine Aufbereitung oder keine Vorversion vorhanden

  const before = vs[polishIndex - 1];
  const after = vs[polishIndex];
  const beforeLen = before.content.length;
  const afterLen = after.content.length;
  if (beforeLen === 0) continue;
  const pctChange = ((afterLen - beforeLen) / beforeLen) * 100;

  if (pctChange <= -THRESHOLD_PCT) {
    results.push({ slug: skill.slug, name: skill.name, beforeLen, afterLen, pctChange });
  }
}

results.sort((a, b) => a.pctChange - b.pctChange);

console.log(`${skills.length} Skills prueft, Schwellwert: -${THRESHOLD_PCT}%\n`);
console.log(`=== Starke Kuerzung durch KI-Aufbereitung (>= ${THRESHOLD_PCT}% weniger Zeichen) ===`);
if (results.length === 0) {
  console.log("Keine gefunden.");
} else {
  for (const r of results) {
    console.log(
      `  ${r.slug} ("${r.name}"): ${r.beforeLen} -> ${r.afterLen} Zeichen (${r.pctChange.toFixed(1)}%)`
    );
  }
}
console.log(`\nAuffaellig: ${results.length} von ${skills.length} Skills.`);
