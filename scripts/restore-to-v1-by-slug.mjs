// @ts-check
// Setzt eine feste Liste von Skills auf ihre Version 1 (Original-Import)
// zurueck. Diese Skills waren durch die KI-Aufbereitung mitten im Satz
// abgeschnitten, aber mit einem so geringen prozentualen Laengenverlust,
// dass der urspruengliche 35%-Kuerzungscheck sie nicht erfasst hat (die
// KI hat teils sogar laenger geschrieben, z.B. durch Uebersetzung ins
// Deutsche, dabei aber unvollstaendig geendet). Gefunden durch
// audit-incomplete-endings.mjs und manuell verifiziert (Version 1 endet
// bei allen sechs mit einem vollstaendigen Satz).
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/restore-to-v1-by-slug.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

const SLUGS = [
  "agent-governance",
  "gtm-partnership-architecture",
  "morning",
  "quasi-coder",
  "refactor",
  "web-coder",
];

const { data: profiles } = await supabase
  .from("profiles")
  .select("id")
  .order("created_at", { ascending: true })
  .limit(1);
const createdBy = profiles?.[0]?.id;

for (const slug of SLUGS) {
  const { data: skill, error: findErr } = await supabase
    .from("skills")
    .select("id, current_version")
    .eq("slug", slug)
    .single();
  if (findErr || !skill) {
    console.error(`NICHT GEFUNDEN: ${slug}`, findErr?.message);
    continue;
  }

  const { data: v1, error: v1Err } = await supabase
    .from("skill_versions")
    .select("content")
    .eq("skill_id", skill.id)
    .eq("version", 1)
    .single();
  if (v1Err || !v1) {
    console.error(`Version 1 nicht gefunden für "${slug}":`, v1Err?.message);
    continue;
  }

  const newVersion = skill.current_version + 1;
  const { error: updateErr } = await supabase
    .from("skills")
    .update({ content: v1.content, current_version: newVersion })
    .eq("id", skill.id);
  if (updateErr) {
    console.error(`FEHLER bei "${slug}":`, updateErr.message);
    continue;
  }

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: newVersion,
    content: v1.content,
    change_note: "Wiederherstellung: Inhalt endete mitten im Satz (KI-Aufbereitung durch max_tokens abgeschnitten, vom prozentualen Kürzungscheck nicht erkannt)",
    created_by: createdBy,
  });

  console.log(`Wiederhergestellt "${slug}" auf Version 1 (neue Version ${newVersion}, ${v1.content.length} Zeichen).`);
}
