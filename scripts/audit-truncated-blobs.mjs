// @ts-check
// Read-only Audit: durchsucht den Inhalt ALLER Skills nach eingebetteten
// Base64-Bloecken (Bilder, PDFs etc.) und prueft, ob sie strukturell
// vollstaendig sind. Hintergrund: die "KI-Aufbereitung" hat beim Skill
// wmc-branding ein eingebettetes Logo-Base64 mitten im String abgeschnitten
// (10192 -> 3342 Zeichen), das Bild war dadurch nicht mehr dekodierbar.
// Dieses Skript prueft, ob dasselbe Problem noch bei anderen Skills besteht.
//
// Nimmt NICHTS an der Datenbank vor, gibt nur einen Bericht aus.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/audit-truncated-blobs.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

// Lange, ununterbrochene Base64-artige Zeichenketten (>= 150 Zeichen).
const BLOB_PATTERN = /[A-Za-z0-9+/]{150,}={0,2}/g;

function classifyAndCheck(token) {
  let buf;
  try {
    buf = Buffer.from(token, "base64");
  } catch {
    return { kind: "nicht dekodierbar", complete: false };
  }
  if (buf.length < 20) return null; // zu kurz, wahrscheinlich kein echter Blob

  const hex8 = buf.subarray(0, 8).toString("hex");
  if (hex8 === "89504e470d0a1a0a") {
    const hasIend = buf.includes(Buffer.from("IEND"));
    return { kind: "PNG", complete: hasIend };
  }
  if (buf.subarray(0, 2).toString("hex") === "ffd8") {
    const tail = buf.subarray(-2).toString("hex");
    return { kind: "JPEG", complete: tail === "ffd9" };
  }
  if (buf.subarray(0, 4).toString("ascii") === "%PDF") {
    const tail = buf.subarray(-1024).toString("latin1");
    return { kind: "PDF", complete: tail.includes("%%EOF") };
  }
  if (buf.subarray(0, 4).toString("hex") === "504b0304") {
    // ZIP/OOXML (docx/xlsx/pptx) - endet auf End-of-Central-Directory 0x06054b50
    const tail = buf.subarray(-64);
    const hasEocd = tail.includes(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
    return { kind: "ZIP/OOXML", complete: hasEocd };
  }
  // Unbekannter Typ - nur melden, wenn auffaellig lang, aber nicht als
  // beschaedigt werten (koennte ein Hash, eine URL oder harmloser Text sein).
  if (token.length >= 400) return { kind: "unbekannt (nicht klassifiziert)", complete: null };
  return null;
}

const { data: skills, error } = await supabase
  .from("skills")
  .select("id, slug, name, content, current_version")
  .order("name");
if (error) {
  console.error("Fehler beim Laden der Skills:", error.message);
  process.exit(1);
}

console.log(`${skills.length} Skills werden geprueft...\n`);

const damaged = [];
const suspicious = [];

for (const skill of skills) {
  const matches = skill.content.match(BLOB_PATTERN);
  if (!matches) continue;

  for (const token of matches) {
    const result = classifyAndCheck(token);
    if (!result) continue;
    if (result.complete === false) {
      damaged.push({ slug: skill.slug, name: skill.name, kind: result.kind, tokenLength: token.length });
    } else if (result.complete === null) {
      suspicious.push({ slug: skill.slug, name: skill.name, kind: result.kind, tokenLength: token.length });
    }
  }
}

console.log("=== BESCHAEDIGT (strukturell unvollstaendig, hoechste Prioritaet) ===");
if (damaged.length === 0) {
  console.log("Keine gefunden.");
} else {
  for (const d of damaged) {
    console.log(`  ${d.slug} ("${d.name}"): ${d.kind}, Block-Laenge ${d.tokenLength} Zeichen - UNVOLLSTAENDIG`);
  }
}

console.log("\n=== Unklassifizierte lange Bloecke (zur manuellen Pruefung, nicht zwingend ein Fehler) ===");
if (suspicious.length === 0) {
  console.log("Keine gefunden.");
} else {
  for (const s of suspicious) {
    console.log(`  ${s.slug} ("${s.name}"): Block-Laenge ${s.tokenLength} Zeichen`);
  }
}

console.log(`\nGeprueft: ${skills.length} Skills. Beschaedigt: ${damaged.length}. Unklassifiziert: ${suspicious.length}.`);
