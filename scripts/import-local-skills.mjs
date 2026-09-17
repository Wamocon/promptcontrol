// @ts-check
// Bulk-Import: liest alle lokal vorhandenen Skills, Copilot-Instructions und
// Projekt-Skills von diesem Rechner ein und legt sie als Skills in der
// promptcontrol-Skills-Bibliothek an (Inhalt selbst, keine Zusatzdateien in
// diesem ersten Durchlauf).
//
// Aufruf (Werte zeigen auf die selbst gehostete Instanz, NICHT auf .env.local):
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/import-local-skills.mjs

import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  db: { schema: SCHEMA },
});

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

function firstLine(text) {
  const line = text.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
  return line.replace(/^#+\s*/, "").trim().slice(0, 300);
}

function safeReadDir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/** Findet SKILL.md (case-insensitive) direkt in einem Ordner. */
function findSkillMd(dir) {
  const entries = safeReadDir(dir);
  const hit = entries.find((e) => e.isFile() && /^skill\.md$/i.test(e.name));
  return hit ? join(dir, hit.name) : null;
}

const items = []; // { name, description, content, category }

// --- 1. .claude/skills (Top-Level, Marketplace-Sammlung) -------------------
const homeSkills = "C:\\Users\\Nurzhan Kukeyev\\.claude\\skills";
for (const entry of safeReadDir(homeSkills)) {
  if (!entry.isDirectory() || entry.name === "synced") continue;
  const dir = join(homeSkills, entry.name);
  const skillMd = findSkillMd(dir);
  if (!skillMd) continue;
  const raw = readFileSync(skillMd, "utf8");
  const parsed = parseSkillMarkdown(raw);
  items.push({
    name: parsed.name || entry.name,
    description: parsed.description || firstLine(parsed.content),
    content: parsed.content,
    category: "Marketplace-Skills",
  });
}

// --- 2. .claude/skills/synced/<hash> (Claude.ai-Konto-Skills) --------------
const syncedRoot = join(homeSkills, "synced");
for (const bucket of safeReadDir(syncedRoot)) {
  if (!bucket.isDirectory()) continue;
  const bucketDir = join(syncedRoot, bucket.name);
  for (const entry of safeReadDir(bucketDir)) {
    if (!entry.isDirectory()) continue;
    const dir = join(bucketDir, entry.name);
    const skillMd = findSkillMd(dir);
    if (!skillMd) continue;
    const raw = readFileSync(skillMd, "utf8");
    const parsed = parseSkillMarkdown(raw);
    const isWmc = entry.name.toLowerCase().startsWith("wmc-");
    items.push({
      name: parsed.name || entry.name,
      description: parsed.description || firstLine(parsed.content),
      content: parsed.content,
      category: isWmc ? "WMC" : "Claude-Standard-Skills",
    });
  }
}

// --- 3. Projekt-eigene Skills (.github/skills/*/SKILL.md) ------------------
const projectSkillsRoot = "D:\\IDEA\\Projekt\\promptcontrol\\.github\\skills";
for (const entry of safeReadDir(projectSkillsRoot)) {
  if (!entry.isDirectory()) continue;
  const dir = join(projectSkillsRoot, entry.name);
  const skillMd = findSkillMd(dir);
  if (!skillMd) continue;
  const raw = readFileSync(skillMd, "utf8");
  const parsed = parseSkillMarkdown(raw);
  items.push({
    name: parsed.name || entry.name,
    description: parsed.description || firstLine(parsed.content),
    content: parsed.content,
    category: "Projekt-intern (promptcontrol)",
  });
}

// --- 4. Copilot-Instructions (.github/instructions/*.instructions.md) -----
const instructionsDir = "D:\\IDEA\\Projekt\\promptcontrol\\.github\\instructions";
for (const entry of safeReadDir(instructionsDir)) {
  if (!entry.isFile() || !entry.name.endsWith(".instructions.md")) continue;
  const raw = readFileSync(join(instructionsDir, entry.name), "utf8");
  const parsed = parseSkillMarkdown(raw); // applyTo statt name/description, meist leer
  const niceName = entry.name.replace(/\.instructions\.md$/, "");
  items.push({
    name: `${niceName} (Instructions)`,
    description: parsed.description || firstLine(parsed.content) || `Copilot-Instruction für ${niceName}`,
    content: parsed.content,
    category: "Copilot-Instructions",
  });
}

// --- 5. .github/copilot-instructions.md (einzelne Datei) -------------------
try {
  const raw = readFileSync("D:\\IDEA\\Projekt\\promptcontrol\\.github\\copilot-instructions.md", "utf8");
  items.push({
    name: "Copilot-Projektinstruktionen (promptcontrol)",
    description: firstLine(raw),
    content: raw,
    category: "Copilot-Instructions",
  });
} catch {
  // Datei existiert nicht, ueberspringen
}

console.log(`Gefunden: ${items.length} Skills/Instructions zum Import.`);

// --- Ausführenden Admin-Nutzer ermitteln -----------------------------------
const { data: profiles, error: profileErr } = await supabase
  .from("profiles")
  .select("id, org_id, email, role")
  .order("created_at", { ascending: true })
  .limit(1);

if (profileErr || !profiles?.length) {
  console.error("Kein Profil gefunden, zuerst im Dashboard registrieren.", profileErr?.message);
  process.exit(1);
}
const { id: createdBy, org_id: orgId } = profiles[0];
console.log(`Import läuft unter Organisation ${orgId}, Ersteller-Profil ${createdBy}.`);

// --- Kategorien anlegen (idempotent) ---------------------------------------
const categoryNames = [...new Set(items.map((i) => i.category))];
const categoryColors = {
  "Marketplace-Skills": "#6366f1",
  "Claude-Standard-Skills": "#8b5cf6",
  "WMC": "#f59e0b",
  "Projekt-intern (promptcontrol)": "#10b981",
  "Copilot-Instructions": "#ef4444",
};
const categoryIdByName = {};
for (const name of categoryNames) {
  const { data: existing } = await supabase
    .from("skill_categories")
    .select("id")
    .eq("org_id", orgId)
    .eq("name", name)
    .maybeSingle();
  if (existing) {
    categoryIdByName[name] = existing.id;
    continue;
  }
  const { data: created, error } = await supabase
    .from("skill_categories")
    .insert({ org_id: orgId, name, color: categoryColors[name] ?? "#6366f1" })
    .select("id")
    .single();
  if (error) {
    console.error(`Kategorie "${name}" konnte nicht angelegt werden:`, error.message);
    continue;
  }
  categoryIdByName[name] = created.id;
}

// --- Skills einfügen ---------------------------------------------------------
const usedSlugs = new Set();
let imported = 0;
let skipped = 0;

for (const item of items) {
  let slug = slugify(item.name) || `skill-${imported + skipped + 1}`;
  if (usedSlugs.has(slug)) {
    let n = 2;
    while (usedSlugs.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  usedSlugs.add(slug);

  const { data: skill, error } = await supabase
    .from("skills")
    .insert({
      org_id: orgId,
      name: item.name.slice(0, 200),
      slug,
      description: (item.description ?? "").slice(0, 2000),
      content: item.content,
      category_id: categoryIdByName[item.category] ?? null,
      status: "active",
      created_by: createdBy,
    })
    .select("id")
    .single();

  if (error) {
    console.error(`ÜBERSPRUNGEN "${item.name}": ${error.message}`);
    skipped++;
    continue;
  }

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: 1,
    content: item.content,
    change_note: "Bulk-Import vom lokalen Rechner",
    created_by: createdBy,
  });

  imported++;
  if (imported % 25 === 0) console.log(`... ${imported} importiert`);
}

console.log("\n=== Zusammenfassung ===");
console.log(`Importiert: ${imported}`);
console.log(`Übersprungen (Fehler): ${skipped}`);
console.log("Kategorien:", Object.keys(categoryIdByName).join(", "));
