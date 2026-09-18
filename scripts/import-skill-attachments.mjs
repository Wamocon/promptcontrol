// @ts-check
// Laedt Zusatzdateien (alles ausser SKILL.md) aus den lokalen Skill-Ordnern
// hoch, die beim urspruenglichen Bulk-Import (import-local-skills.mjs) nicht
// mitgenommen wurden. Nutzt exakt dieselbe Verzeichnis-Reihenfolge und
// Slug-Vergabe wie der Original-Import, damit jede Datei am richtigen Skill
// landet (auch bei Slug-Kollisionen mit "-2"-Suffix).
//
// "gstack" wird bewusst ausgeschlossen: das ist kein Skill mit Anhaengen,
// sondern ein komplett separat geklontes Software-Repository (eigenes .git,
// node_modules, ~90 Unterordner, 1,28 GB) mit einer SKILL.md im Root.
//
// Aufruf (Werte zeigen auf die selbst gehostete Instanz):
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/import-skill-attachments.mjs

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative, resolve, extname } from "path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";
const BUCKET = "skill-files";
const EXCLUDE_SLUGS = new Set(["gstack"]);
const SKIP_DIRS = new Set([".git", "node_modules", "__pycache__", ".venv", "venv", ".next", "dist", "build", ".cache"]);

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
  const [, frontmatter] = match;
  let name = "";
  for (const line of frontmatter.split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key === "name") name = value;
  }
  return { name };
}

function safeReadDir(dir) {
  try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}
function findSkillMd(dir) {
  const entries = safeReadDir(dir);
  const hit = entries.find((e) => e.isFile() && /^skill\.md$/i.test(e.name));
  return hit ? join(dir, hit.name) : null;
}
function listAllFiles(dir) {
  const out = [];
  function walk(d) {
    for (const e of safeReadDir(d)) {
      if (e.isDirectory() && SKIP_DIRS.has(e.name.toLowerCase())) continue;
      const full = join(d, e.name);
      if (e.isDirectory()) walk(full);
      else out.push(full);
    }
  }
  walk(dir);
  return out;
}

// --- Dieselbe Reihenfolge wie import-local-skills.mjs, um identische Slugs zu erhalten ---
const nameItems = []; // { name, dir | null } in Original-Reihenfolge

const homeSkills = "C:/Users/Nurzhan Kukeyev/.claude/skills";
for (const entry of safeReadDir(homeSkills)) {
  if (!entry.isDirectory() || entry.name === "synced") continue;
  const dir = join(homeSkills, entry.name);
  const skillMd = findSkillMd(dir);
  if (!skillMd) continue;
  const parsed = parseSkillMarkdown(readFileSync(skillMd, "utf8"));
  nameItems.push({ name: parsed.name || entry.name, dir });
}

const syncedRoot = join(homeSkills, "synced");
for (const bucket of safeReadDir(syncedRoot)) {
  if (!bucket.isDirectory()) continue;
  const bucketDir = join(syncedRoot, bucket.name);
  for (const entry of safeReadDir(bucketDir)) {
    if (!entry.isDirectory()) continue;
    const dir = join(bucketDir, entry.name);
    const skillMd = findSkillMd(dir);
    if (!skillMd) continue;
    const parsed = parseSkillMarkdown(readFileSync(skillMd, "utf8"));
    nameItems.push({ name: parsed.name || entry.name, dir });
  }
}

const projectSkillsRoot = "D:/IDEA/Projekt/promptcontrol/.github/skills";
for (const entry of safeReadDir(projectSkillsRoot)) {
  if (!entry.isDirectory()) continue;
  const dir = join(projectSkillsRoot, entry.name);
  const skillMd = findSkillMd(dir);
  if (!skillMd) continue;
  const parsed = parseSkillMarkdown(readFileSync(skillMd, "utf8"));
  nameItems.push({ name: parsed.name || entry.name, dir });
}

const instructionsDir = "D:/IDEA/Projekt/promptcontrol/.github/instructions";
for (const entry of safeReadDir(instructionsDir)) {
  if (!entry.isFile() || !entry.name.endsWith(".instructions.md")) continue;
  const niceName = entry.name.replace(/\.instructions\.md$/, "");
  nameItems.push({ name: `${niceName} (Instructions)`, dir: null });
}
try {
  readFileSync("D:/IDEA/Projekt/promptcontrol/.github/copilot-instructions.md", "utf8");
  nameItems.push({ name: "Copilot-Projektinstruktionen (promptcontrol)", dir: null });
} catch {
  // Datei existiert nicht
}

// --- Slugs exakt wie beim Original-Import vergeben ---
const usedSlugs = new Set();
const slugToDir = new Map();
let idx = 0;
for (const item of nameItems) {
  let slug = slugify(item.name) || `skill-${idx + 1}`;
  if (usedSlugs.has(slug)) {
    let n = 2;
    while (usedSlugs.has(`${slug}-${n}`)) n++;
    slug = `${slug}-${n}`;
  }
  usedSlugs.add(slug);
  if (item.dir) slugToDir.set(slug, item.dir);
  idx++;
}

console.log(`${slugToDir.size} Skill-Ordner mit rekonstruierten Slugs.`);

const CONTENT_TYPES = {
  ".md": "text/markdown", ".txt": "text/plain", ".json": "application/json",
  ".js": "text/javascript", ".mjs": "text/javascript", ".ts": "text/plain",
  ".py": "text/x-python", ".sh": "text/x-sh", ".yml": "text/yaml", ".yaml": "text/yaml",
  ".css": "text/css", ".html": "text/html", ".xml": "application/xml", ".xsd": "application/xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml",
  ".gif": "image/gif", ".pdf": "application/pdf", ".csv": "text/csv", ".toml": "text/plain",
  ".ipynb": "application/json", ".tmpl": "text/plain", ".lock": "text/plain",
  ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff", ".woff2": "font/woff2",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
function contentTypeFor(file) {
  return CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
}

let skillsProcessed = 0, filesUploaded = 0, filesSkipped = 0, skillsNotFound = 0;

for (const [slug, dir] of slugToDir) {
  if (EXCLUDE_SLUGS.has(slug)) {
    console.log(`AUSGESCHLOSSEN "${slug}": kein Skill-Anhang, sondern externes Repository.`);
    continue;
  }
  const skillMd = findSkillMd(dir);
  const files = listAllFiles(dir).filter((f) => resolve(f) !== resolve(skillMd));
  if (files.length === 0) continue;

  const { data: skill, error: findErr } = await supabase
    .from("skills")
    .select("id, org_id")
    .eq("slug", slug)
    .maybeSingle();

  if (findErr || !skill) {
    console.error(`NICHT GEFUNDEN in DB: Slug "${slug}" (Ordner ${dir})`);
    skillsNotFound++;
    continue;
  }

  skillsProcessed++;
  let uploadedForSkill = 0;
  for (const file of files) {
    const relPath = relative(dir, file).split("\\").join("/");
    const storagePath = `${skill.org_id}/${skill.id}/${relPath}`;
    let buffer;
    try {
      buffer = readFileSync(file);
    } catch (e) {
      console.error(`  Lesefehler "${relPath}":`, e.message);
      filesSkipped++;
      continue;
    }

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: contentTypeFor(file), upsert: true });
    if (uploadErr) {
      console.error(`  Upload fehlgeschlagen "${relPath}":`, uploadErr.message);
      filesSkipped++;
      continue;
    }

    const { error: dbErr } = await supabase.from("skill_files").upsert(
      {
        skill_id: skill.id,
        path: relPath,
        storage_path: storagePath,
        content_type: contentTypeFor(file),
        size_bytes: statSync(file).size,
      },
      { onConflict: "skill_id,path" }
    );
    if (dbErr) {
      console.error(`  DB-Eintrag fehlgeschlagen "${relPath}":`, dbErr.message);
      filesSkipped++;
      continue;
    }
    uploadedForSkill++;
    filesUploaded++;
  }
  console.log(`"${slug}": ${uploadedForSkill}/${files.length} Dateien hochgeladen.`);
}

console.log("\n=== Zusammenfassung ===");
console.log(`Skills bearbeitet: ${skillsProcessed}`);
console.log(`Skills nicht in DB gefunden: ${skillsNotFound}`);
console.log(`Dateien hochgeladen: ${filesUploaded}`);
console.log(`Dateien uebersprungen (Fehler): ${filesSkipped}`);
