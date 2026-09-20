// @ts-check
// Entfernt personalisierte Ansprache ("Niko") aus Skills, die fuer das
// gesamte WAMOCON-Team gedacht sind, nicht nur fuer eine Person. Betrifft
// wmc-branding, wmc-externe-kundenkommunikation, wma-externe-kundenkommunikation
// (einzige Treffer laut vorheriger Suche). Ersetzt gezielt einzelne Saetze
// per exaktem String-Match, fasst den Rest des Inhalts (inkl. Base64-Bloecke)
// nicht an.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/degenericize-personal-refs.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

const REPLACEMENTS = {
  "wmc-branding": [
    [
      "**Regel ohne Ausnahme:** Jedes Dokument, das für Niko erstellt wird – Word (.docx), PDF, HTML-Berichte/-Seiten, Markdown-Exporte, Präsentationen, Artifacts, Reports jeder Art – trägt das WMC-Branding. Nicht fragen, ob gewünscht; einfach anwenden. Nur weglassen, wenn Niko es für ein konkretes Dokument ausdrücklich abwählt.",
      "**Regel ohne Ausnahme:** Jedes Dokument, das erstellt wird, egal ob Word (.docx), PDF, HTML-Bericht oder -Seite, Markdown-Export, Präsentation, Artifact oder Report jeder Art, trägt das WMC-Branding. Nicht fragen, ob gewünscht; einfach anwenden. Nur weglassen, wenn es für ein konkretes Dokument ausdrücklich abgewählt wird.",
    ],
    [
      '## Wo die Original-Dateien liegen (auf Nikos Rechner „wmc-h-04-ns")\n\nOrdner: `C:\\Users\\Nurzhan Kukeyev\\Claude\\WMC-Branding\\` (bei Bedarf Ordnerzugriff auf `~/Claude` anfragen und Dateien stagen)\n\n- `WMC-Vorlage.docx` – leere Word-Vorlage mit fertiger Kopf-/Fußzeile → **immer als Basis für Word-Dokumente verwenden**\n- `WMC-Vorlage.dotx` – dieselbe Vorlage als Word-Vorlagendatei (liegt zusätzlich in `%APPDATA%\\Microsoft\\Templates`)',
      "## Wo die Original-Dateien liegen\n\nDiese Dateien liegen als Zusatzdateien direkt bei diesem Skill in der Skills-Bibliothek bei, kein lokaler Ordnerzugriff nötig.\n\n- `WMC-Vorlage.docx` – leere Word-Vorlage mit fertiger Kopf-/Fußzeile → **immer als Basis für Word-Dokumente verwenden**\n- `WMC-Vorlage.dotx` – dieselbe Vorlage als Word-Vorlagendatei (kann zusätzlich lokal in `%APPDATA%\\Microsoft\\Templates` abgelegt werden, damit Word sie als Vorlage anbietet)",
    ],
    [
      "Ist der Ordner nicht erreichbar (z. B. Cloud-Session ohne Ordnerverbindung), gilt der Fallback unten – das Logo ist hier eingebettet, es fehlt also nie.",
      "Sind die Zusatzdateien nicht verfügbar, zum Beispiel in einer Session ohne Dateizugriff, gilt der Fallback unten. Das Logo ist hier eingebettet, es fehlt also nie.",
    ],
  ],
  "wmc-externe-kundenkommunikation": [
    [
      'Dieser Skill gilt, wenn Niko eine Email an einen Kunden, Interessenten oder externen Partner im Namen der WAMOCON GmbH (WMC, IT-Testmanagement) entwerfen lassen möchte, zum Beispiel ein Angebot, einen Projektstatus, eine Rückfrage oder ein Nachfassen. Er ist aus der Vorlage "WMC Vorlage.html" abgeleitet und liefert am Ende zwei Dateien, eine .eml-Datei, die sich in Outlook per Doppelklick öffnen lässt, und eine .html-Datei, deren Inhalt sich in Gmail einfügen lässt.',
      'Dieser Skill gilt, wenn eine Email an einen Kunden, Interessenten oder externen Partner im Namen der WAMOCON GmbH (WMC, IT-Testmanagement) entworfen werden soll, zum Beispiel ein Angebot, ein Projektstatus, eine Rückfrage oder ein Nachfassen. Er ist aus der Vorlage "WMC Vorlage.html" abgeleitet und liefert am Ende zwei Dateien, eine .eml-Datei, die sich in Outlook per Doppelklick öffnen lässt, und eine .html-Datei, deren Inhalt sich in Gmail einfügen lässt.',
    ],
    [
      "4. Beide Dateien unter `/mnt/user-data/outputs/` ablegen und an Niko liefern.",
      "4. Beide Dateien unter `/mnt/user-data/outputs/` ablegen und bereitstellen.",
    ],
    [
      "Falls für die aktuelle Email ein anderer Absender genannt wird, zum Beispiel Niko selbst, diese Felder entsprechend ersetzen und, falls bekannt, auch eine eigene Telefonnummer ergänzen.",
      "Falls für die aktuelle Email ein anderer Absender genannt wird, diese Felder entsprechend ersetzen und, falls bekannt, auch eine eigene Telefonnummer ergänzen.",
    ],
    [
      "Diese Angaben hat Niko bestätigt und gelten als verbindlich für jede WMC-Kundenemail.",
      "Diese Angaben sind bestätigt und gelten als verbindlich für jede WMC-Kundenemail.",
    ],
  ],
  "wma-externe-kundenkommunikation": [
    [
      'Dieser Skill gilt, wenn Niko eine Email an einen Kunden, Interessenten, eine Behörde oder einen externen Partner im Namen der WAMOCON Academy GmbH (WMA, IT-Bildungszentrum) entwerfen lassen möchte. Er ist aus der Vorlage "WMA Vorlage.html" abgeleitet, dort als Beispiel eine formelle Anfrage zur AZAV-Trägerzulassung an eine Zertifizierungsstelle. Er liefert am Ende zwei Dateien, eine .eml-Datei, die sich in Outlook per Doppelklick öffnen lässt, und eine .html-Datei, deren Inhalt sich in Gmail einfügen lässt.',
      'Dieser Skill gilt, wenn eine Email an einen Kunden, Interessenten, eine Behörde oder einen externen Partner im Namen der WAMOCON Academy GmbH (WMA, IT-Bildungszentrum) entworfen werden soll. Er ist aus der Vorlage "WMA Vorlage.html" abgeleitet, dort als Beispiel eine formelle Anfrage zur AZAV-Trägerzulassung an eine Zertifizierungsstelle. Er liefert am Ende zwei Dateien, eine .eml-Datei, die sich in Outlook per Doppelklick öffnen lässt, und eine .html-Datei, deren Inhalt sich in Gmail einfügen lässt.',
    ],
    [
      "4. Beide Dateien unter `/mnt/user-data/outputs/` ablegen und an Niko liefern.",
      "4. Beide Dateien unter `/mnt/user-data/outputs/` ablegen und bereitstellen.",
    ],
    [
      "Niko hat bestätigt, dass die Homepage der WAMOCON Academy test-it-academy.com lautet (nicht wamocon.com und nicht die .de-Endung aus der Ursprungsvorlage). Die Email-Adresse wurde entsprechend auf dieselbe Domain mit der Endung .com umgestellt, das bitte einmal gegenprüfen, falls die tatsächliche Absenderadresse davon abweicht. Falls für die aktuelle Email ein anderer Absender genannt wird, zum Beispiel Niko selbst, diese Felder entsprechend ersetzen.",
      "Bestätigt ist, dass die Homepage der WAMOCON Academy test-it-academy.com lautet (nicht wamocon.com und nicht die .de-Endung aus der Ursprungsvorlage). Die Email-Adresse wurde entsprechend auf dieselbe Domain mit der Endung .com umgestellt, das bitte einmal gegenprüfen, falls die tatsächliche Absenderadresse davon abweicht. Falls für die aktuelle Email ein anderer Absender genannt wird, diese Felder entsprechend ersetzen.",
    ],
    [
      "Diese Angaben hat Niko bestätigt und gelten als verbindlich für jede WMA-Kundenemail.",
      "Diese Angaben sind bestätigt und gelten als verbindlich für jede WMA-Kundenemail.",
    ],
  ],
};

const { data: profiles } = await supabase
  .from("profiles")
  .select("id")
  .order("created_at", { ascending: true })
  .limit(1);
const createdBy = profiles?.[0]?.id;

for (const [slug, pairs] of Object.entries(REPLACEMENTS)) {
  const { data: skill, error: findErr } = await supabase
    .from("skills")
    .select("id, content, current_version")
    .eq("slug", slug)
    .single();
  if (findErr || !skill) {
    console.error(`NICHT GEFUNDEN: ${slug}`, findErr?.message);
    continue;
  }

  let content = skill.content;
  let replaced = 0;
  for (const [oldText, newText] of pairs) {
    if (!content.includes(oldText)) {
      console.error(`  WARNUNG bei "${slug}": Text nicht gefunden (evtl. schon geändert):\n    ${oldText.slice(0, 80)}...`);
      continue;
    }
    content = content.replace(oldText, newText);
    replaced++;
  }

  if (replaced === 0) {
    console.log(`ÜBERSPRUNGEN "${slug}": keine Ersetzung nötig oder alle Stellen schon geändert.`);
    continue;
  }

  const newVersion = skill.current_version + 1;
  const { error: updateErr } = await supabase
    .from("skills")
    .update({ content, current_version: newVersion })
    .eq("id", skill.id);
  if (updateErr) {
    console.error(`FEHLER bei "${slug}":`, updateErr.message);
    continue;
  }

  await supabase.from("skill_versions").insert({
    skill_id: skill.id,
    version: newVersion,
    content,
    change_note: "Personalisierte Ansprache (\"Niko\") durch generische Formulierung ersetzt, Skill gilt fürs ganze Team",
    created_by: createdBy,
  });

  console.log(`Aktualisiert "${slug}": ${replaced}/${pairs.length} Stellen ersetzt (Version ${newVersion}).`);
}
