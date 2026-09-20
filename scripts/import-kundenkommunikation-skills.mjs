// @ts-check
// Importiert die zwei neuen, manuell erstellten Skills
// wmc-externe-kundenkommunikation und wma-externe-kundenkommunikation.
// Die Quelldateien enthielten je ein beschaedigtes eingebettetes Logo
// (CRC-Fehler in den PNG-Bilddaten), die hier verwendeten Inhalte haben
// bereits ein korrigiertes, verifiziertes Logo (siehe Chat-Verlauf).
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/import-kundenkommunikation-skills.mjs

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSkillMarkdown(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { name: "", description: "", content: raw.trim() };
  const [, frontmatter, body] = match;
  let name = "";
  let description = "";
  for (const line of frontmatter.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "name") name = value;
    if (key === "description") description = value;
  }
  return { name, description, content: body.trim() };
}

const files = [
  "D:/tmp/skill_check/wmc_fixed_SKILL.md",
  "D:/tmp/skill_check/wma_fixed_SKILL.md",
];

const { data: profiles, error: profileErr } = await supabase
  .from("profiles")
  .select("id, org_id")
  .order("created_at", { ascending: true })
  .limit(1);
if (profileErr || !profiles?.length) {
  console.error("Kein Profil gefunden:", profileErr?.message);
  process.exit(1);
}
const { id: createdBy, org_id: orgId } = profiles[0];

const { data: wmcCategory } = await supabase
  .from("skill_categories")
  .select("id")
  .eq("org_id", orgId)
  .eq("name", "WMC")
  .maybeSingle();

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const parsed = parseSkillMarkdown(raw);
  const slug = slugify(parsed.name);

  const { data: existing } = await supabase.from("skills").select("id").eq("slug", slug).maybeSingle();
  if (existing) {
    console.log(`ÜBERSPRUNGEN "${slug}": existiert bereits.`);
    continue;
  }

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      org_id: orgId,
      name: parsed.name,
      slug,
      description: parsed.description.slice(0, 2000),
      content: parsed.content,
      category_id: wmcCategory?.id ?? null,
      status: "active",
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`FEHLER bei "${slug}":`, error.message);
    continue;
  }

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: 1,
    content: parsed.content,
    change_note: "Import (Logo-Base64 vor dem Import korrigiert, Original war beschädigt)",
    created_by: createdBy,
  });

  console.log(`Importiert "${slug}" (${parsed.content.length} Zeichen).`);
}
