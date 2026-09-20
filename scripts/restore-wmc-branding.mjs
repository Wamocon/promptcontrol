// @ts-check
// Stellt den wmc-branding-Skill wieder her: die KI-Aufbereitung hat das
// eingebettete Logo-Base64 mitten im String abgeschnitten (10192 -> 3342
// Zeichen, damit nicht mehr dekodierbar) und eine Abschluss-Checkliste
// entfernt. Ersetzt den Inhalt durch die vollstaendige, lokal gepflegte
// SKILL.md und laedt die zugehoerigen Zusatzdateien hoch.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/restore-wmc-branding.mjs

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";
const BUCKET = "skill-files";
const SOURCE_DIR = "C:/Users/Nurzhan Kukeyev/Claude/WMC-Branding";
const EXCLUDE = new Set(["SKILL.md", "Claude outputs", "__pycache__"]);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

function parseSkillMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { content: raw.trim() };
  return { content: match[2].trim() };
}

const raw = readFileSync(join(SOURCE_DIR, "SKILL.md"), "utf8");
const { content } = parseSkillMarkdown(raw);
console.log(`Neuer Inhalt: ${content.length} Zeichen (vorher in der DB: 8233).`);

const { data: skill, error: findErr } = await supabase
  .from("skills")
  .select("id, org_id, current_version, created_by")
  .eq("slug", "wmc-branding")
  .single();
if (findErr || !skill) {
  console.error("Skill wmc-branding nicht gefunden:", findErr?.message);
  process.exit(1);
}

const newVersion = skill.current_version + 1;
const { error: updateErr } = await supabase
  .from("skills")
  .update({ content, current_version: newVersion })
  .eq("id", skill.id);
if (updateErr) {
  console.error("Update fehlgeschlagen:", updateErr.message);
  process.exit(1);
}

await supabase.from("skill_versions").insert({
  skill_id: skill.id,
  version: newVersion,
  content,
  change_note: "Wiederherstellung: KI-Aufbereitung hatte das eingebettete Logo-Base64 abgeschnitten und die Abschluss-Checkliste entfernt",
  created_by: skill.created_by,
});
console.log(`Inhalt aktualisiert, neue Version ${newVersion}.`);

// --- Zusatzdateien hochladen ---
const CONTENT_TYPES = {
  ".md": "text/markdown", ".txt": "text/plain", ".py": "text/x-python",
  ".html": "text/html", ".png": "image/png",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".dotx": "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  ".pdf": "application/pdf",
};
function contentTypeFor(file) {
  return CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

const entries = readdirSync(SOURCE_DIR, { withFileTypes: true }).filter(
  (e) => e.isFile() && !EXCLUDE.has(e.name)
);

let uploaded = 0;
for (const entry of entries) {
  const file = join(SOURCE_DIR, entry.name);
  const buffer = readFileSync(file);
  const storagePath = `${skill.org_id}/${skill.id}/${entry.name}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: contentTypeFor(file), upsert: true });
  if (uploadErr) {
    console.error(`Upload fehlgeschlagen "${entry.name}":`, uploadErr.message);
    continue;
  }

  const { error: dbErr } = await supabase.from("skill_files").upsert(
    {
      skill_id: skill.id,
      path: entry.name,
      storage_path: storagePath,
      content_type: contentTypeFor(file),
      size_bytes: statSync(file).size,
    },
    { onConflict: "skill_id,path" }
  );
  if (dbErr) {
    console.error(`DB-Eintrag fehlgeschlagen "${entry.name}":`, dbErr.message);
    continue;
  }
  uploaded++;
  console.log(`  hochgeladen: ${entry.name}`);
}

console.log(`\n${uploaded}/${entries.length} Zusatzdateien hochgeladen.`);
