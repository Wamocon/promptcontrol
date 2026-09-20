// @ts-check
// Read-only Audit: prueft, ob der Inhalt jedes Skills mit einem
// vollstaendigen, abgeschlossenen Satz/Block endet, statt mitten im Wort
// oder Satz abzubrechen. Hintergrund: bei "gtm-partnership-architecture"
// wurde bei der KI-Aufbereitung Englisch nach Deutsch uebersetzt (die
// Aufbereitung schreibt laut Systemprompt immer auf Deutsch), und genau
// diese Uebersetzung wurde durch das max_tokens-Limit mitten im Wort
// abgeschnitten. Der reine Laengen-Kuerzungs-Check (audit-polish-shrinkage)
// hat das NICHT erkannt, weil eine deutsche Uebersetzung nicht zwingend
// kuerzer ist als das englische Original, nur eben eventuell unvollstaendig.
// Dieses Audit ist sprachunabhaengig und erkennt jede Art von abruptem Ende.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/audit-incomplete-endings.mjs

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
  .select("id, slug, name, content")
  .order("name");
if (error) {
  console.error("Fehler:", error.message);
  process.exit(1);
}
console.log(`${skills.length} Skills werden auf abrupte Enden geprüft...\n`);

function looksComplete(content) {
  const trimmed = content.trimEnd();
  if (trimmed.length === 0) return true;

  // Unausgeglichene Code-Fence: haengt mitten in einem Codeblock,
  // eindeutiges Zeichen fuer Abbruch.
  const fenceCount = (trimmed.match(/```/g) ?? []).length;
  if (fenceCount % 2 !== 0) return false;

  const lastLine = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0).pop() ?? "";
  const last = lastLine.trim();

  // Innerhalb eines offenen Codeblocks (letzte Zeile ist Code, kein Fence-
  // Abschluss sichtbar) -> per fenceCount oben bereits abgedeckt.

  // Endet auf normales Satzzeichen, schliessendes Markdown-Element oder
  // eine abgeschlossene Tabellenzeile/Listenzeile.
  const OK_END = /[.!?:;"'”“)\]}»›]$|```$|^\s*[-*+]\s|^\s*\d+[.)]\s|^\|.*\|$|^#{1,6}\s/;
  if (OK_END.test(last)) return true;

  // Kurze letzte "Zeile", die nur aus einem einzelnen abgeschlossenen Wort
  // ohne jede Interpunktion besteht, ist verdaechtig, aber nicht garantiert
  // falsch (z.B. eine einzelne Ueberschrift ohne Satzzeichen). Als Heuristik:
  // wenn die letzte Zeile mit einem Kleinbuchstaben endet und laenger als
  // 3 Woerter ist, sehr wahrscheinlich abgeschnitten.
  const words = last.split(/\s+/);
  if (words.length >= 3 && /[a-zäöüß,]$/.test(last)) return false;

  return true;
}

const incomplete = [];
for (const skill of skills) {
  if (!looksComplete(skill.content)) {
    const tail = skill.content.trimEnd().slice(-120).replace(/\n/g, " ⏎ ");
    incomplete.push({ slug: skill.slug, name: skill.name, tail });
  }
}

console.log("=== Skills mit vermutlich abruptem/unvollständigem Ende ===");
if (incomplete.length === 0) {
  console.log("Keine gefunden.");
} else {
  for (const i of incomplete) {
    console.log(`  ${i.slug} ("${i.name}")`);
    console.log(`    ...${i.tail}`);
  }
}
console.log(`\nGeprüft: ${skills.length}. Auffällig: ${incomplete.length}.`);
