// @ts-check
// Stellt bei allen Skills, deren "KI-Aufbereitung" den Inhalt um mindestens
// den angegebenen Schwellwert gekuerzt hat (Standard 35%, Signatur eines
// max_tokens-Abbruchs mitten in der Generierung), den Inhalt der letzten
// Version VOR dieser Aufbereitung wieder her. Name/Beschreibung/Kategorie
// bleiben unveraendert, da diese im Antwortformat vor dem Inhalt generiert
// werden und von einem Abbruch am Ende der Antwort nicht betroffen sind.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/restore-truncated-polish.mjs [Schwellwert-Prozent, Standard 35]

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

const { data: skills, error: skillsErr } = await supabase
  .from("skills")
  .select("id, slug, name, current_version, created_by");
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

let restored = 0;
let skipped = 0;

for (const skill of skills) {
  const vs = bySkill.get(skill.id);
  if (!vs || vs.length < 2) continue;

  const polishIndex = vs.findIndex((v) => v.change_note === "KI-Aufbereitung");
  if (polishIndex <= 0) continue;

  const before = vs[polishIndex - 1];
  const after = vs[polishIndex];
  const beforeLen = before.content.length;
  const afterLen = after.content.length;
  if (beforeLen === 0) continue;
  const pctChange = ((afterLen - beforeLen) / beforeLen) * 100;
  if (pctChange > -THRESHOLD_PCT) continue;

  // Aktueller Inhalt koennte neuer sein als "after" (z.B. wmc-branding
  // wurde bereits manuell restauriert), nicht blind ueberschreiben, wenn
  // der jetzige Inhalt schon laenger ist als die Vor-Aufbereitung-Version.
  const { data: current } = await supabase
    .from("skills")
    .select("content")
    .eq("id", skill.id)
    .single();
  if (current && current.content.length >= beforeLen * 0.9) {
    console.log(`UEBERSPRUNGEN "${skill.slug}": aktueller Inhalt bereits ${current.content.length} Zeichen, keine Wiederherstellung noetig.`);
    skipped++;
    continue;
  }

  const newVersion = skill.current_version + 1;
  const { error: updateErr } = await supabase
    .from("skills")
    .update({ content: before.content, current_version: newVersion })
    .eq("id", skill.id);
  if (updateErr) {
    console.error(`FEHLER bei "${skill.slug}":`, updateErr.message);
    skipped++;
    continue;
  }

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: newVersion,
    content: before.content,
    change_note: `Wiederherstellung: KI-Aufbereitung hatte den Inhalt von ${beforeLen} auf ${afterLen} Zeichen abgeschnitten (${pctChange.toFixed(1)}%)`,
    created_by: skill.created_by,
  });

  console.log(`Wiederhergestellt "${skill.slug}": ${afterLen} -> ${beforeLen} Zeichen (Version ${newVersion}).`);
  restored++;
}

console.log(`\n=== Zusammenfassung ===`);
console.log(`Wiederhergestellt: ${restored}`);
console.log(`Uebersprungen: ${skipped}`);
