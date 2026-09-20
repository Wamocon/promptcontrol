// @ts-check
// Breiter Read-only Audit ueber alle Skills:
// 1. Personenbezogene/rechnerspezifische Pfade und Kennungen (wie der
//    Nikos-Rechner-Pfad, der bei wmc-branding gefunden wurde).
// 2. Eingebettete Base64-Bloecke, die als Bild nicht dekodierbar sind
//    (schreibt sie in eine JSON-Datei, ein zweites Skript prueft sie mit
//    Pillow, da Node keine echte CRC-Validierung von PNG-Bilddaten macht).
// 3. Doppelte Skills (gleicher Name, z.B. durch "-2"-Suffix).
// 4. Unausgeglichene Code-Fences (```), moegliches Zeichen fuer
//    abgeschnittenen oder fehlerhaft eingefuegten Inhalt.
// 5. Verbliebene Platzhalter/TODO-Marker.
//
// Nimmt NICHTS an der Datenbank vor.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/audit-personal-refs-and-integrity.mjs

import { writeFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

const { data: skills, error } = await supabase
  .from("skills")
  .select("id, slug, name, description, content")
  .order("name");
if (error) {
  console.error("Fehler:", error.message);
  process.exit(1);
}
console.log(`${skills.length} Skills werden geprüft...\n`);

// --- 1. Personenbezogene/rechnerspezifische Pfade und Kennungen ---
const PERSONAL_PATTERNS = [
  { label: "Windows-Nutzerpfad", re: /C:\\Users\\[^\\]+\\/g },
  { label: "Nutzername Nurzhan Kukeyev", re: /Nurzhan Kukeyev/g },
  { label: "Rechnername wmc-h-04-ns", re: /wmc-h-04-ns/g },
  { label: "macOS-Nutzerpfad", re: /\/Users\/[^/]+\//g },
  { label: "Persoenliche Anrede 'Niko'", re: /\bNiko\b/g },
];

const personalHits = [];
for (const skill of skills) {
  const haystack = `${skill.name}\n${skill.description ?? ""}\n${skill.content}`;
  for (const { label, re } of PERSONAL_PATTERNS) {
    const matches = haystack.match(re);
    if (matches) {
      personalHits.push({ slug: skill.slug, name: skill.name, label, count: matches.length, beispiel: matches[0] });
    }
  }
}

console.log("=== 1. Personenbezogene/rechnerspezifische Referenzen ===");
if (personalHits.length === 0) {
  console.log("Keine gefunden.\n");
} else {
  for (const h of personalHits) console.log(`  ${h.slug} ("${h.name}"): ${h.label} x${h.count} (z.B. "${h.beispiel}")`);
  console.log();
}

// --- 2. Eingebettete Base64-Bloecke sammeln (Pillow-Check separat) ---
const BLOB_PATTERN = /[A-Za-z0-9+/]{150,}={0,2}/g;
const blobCandidates = [];
for (const skill of skills) {
  const matches = skill.content.match(BLOB_PATTERN);
  if (!matches) continue;
  for (const token of matches) {
    if (token.length < 200) continue;
    // Grobe Vorfilterung: nur Kandidaten mit erkennbarer Magic-Byte-Signatur
    let buf;
    try { buf = Buffer.from(token, "base64"); } catch { continue; }
    if (buf.length < 20) continue;
    const hex8 = buf.subarray(0, 8).toString("hex");
    const isPng = hex8 === "89504e470d0a1a0a";
    const isJpeg = buf.subarray(0, 2).toString("hex") === "ffd8";
    const isPdf = buf.subarray(0, 4).toString("ascii") === "%PDF";
    if (isPng || isJpeg || isPdf) {
      blobCandidates.push({ slug: skill.slug, name: skill.name, token, kind: isPng ? "PNG" : isJpeg ? "JPEG" : "PDF" });
    }
  }
}
writeFileSync("scripts/.audit-blob-candidates.json", JSON.stringify(blobCandidates));
console.log(`=== 2. Eingebettete Bild-/PDF-Bloecke gefunden: ${blobCandidates.length} ===`);
console.log("(echte Dekodier-Pruefung folgt per Python/Pillow in Schritt 2)\n");

// --- 3. Doppelte Skills (gleicher Basisname, "-2"-Suffix oder identisch) ---
const byBaseName = new Map();
for (const skill of skills) {
  const base = skill.name.replace(/\s*\(?\bKopie\b\)?\s*$/i, "").trim();
  if (!byBaseName.has(base)) byBaseName.set(base, []);
  byBaseName.get(base).push(skill.slug);
}
console.log("=== 3. Skills mit identischem Namen (moegliche Duplikate) ===");
let dupCount = 0;
for (const [name, slugs] of byBaseName) {
  if (slugs.length > 1) {
    console.log(`  "${name}": ${slugs.join(", ")}`);
    dupCount++;
  }
}
if (dupCount === 0) console.log("Keine gefunden.");
console.log();

// --- 4. Unausgeglichene Code-Fences ---
console.log("=== 4. Unausgeglichene Code-Fences (```) ===");
let fenceIssues = 0;
for (const skill of skills) {
  const count = (skill.content.match(/```/g) ?? []).length;
  if (count % 2 !== 0) {
    console.log(`  ${skill.slug} ("${skill.name}"): ${count}x \`\`\` (ungerade, evtl. abgeschnitten)`);
    fenceIssues++;
  }
}
if (fenceIssues === 0) console.log("Keine gefunden.");
console.log();

// --- 5. Verbliebene Platzhalter/TODO-Marker ---
const PLACEHOLDER_PATTERNS = [/\bTODO\b/, /\bFIXME\b/, /\bXXX\b/, /\[PLATZHALTER\]/i, /\blorem ipsum\b/i, /<insert[^>]*>/i, /<your[^>]*>/i];
console.log("=== 5. Verbliebene Platzhalter/TODO-Marker ===");
let placeholderCount = 0;
for (const skill of skills) {
  for (const re of PLACEHOLDER_PATTERNS) {
    if (re.test(skill.content)) {
      console.log(`  ${skill.slug} ("${skill.name}"): Muster ${re}`);
      placeholderCount++;
      break;
    }
  }
}
if (placeholderCount === 0) console.log("Keine gefunden.");
