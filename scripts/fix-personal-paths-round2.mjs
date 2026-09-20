// @ts-check
// Behebt zwei weitere personen-/rechnerspezifische Pfade, gefunden durch
// audit-personal-refs-and-integrity.mjs:
// - setup-env-keys: Pfad einer fremden Person ("Maanik Garg", vermutlich aus
//   einem Marketplace-Import), auf keinem WAMOCON-Rechner gueltig.
// - wmc-textregeln: zwei Verweise auf Nikos persoenlichen Rechnerpfad.
//
// Aufruf:
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/fix-personal-paths-round2.mjs

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
  "setup-env-keys": [
    ["C:\\Users\\Maanik Garg\\.env.keys", "%USERPROFILE%\\.env.keys"],
  ],
  "wmc-textregeln": [
    [
      'Diese liegt unter `%APPDATA%\\Microsoft\\Templates\\WMC-Vorlage.dotx` bzw. im Paket `C:\\Users\\Nurzhan Kukeyev\\Claude\\WMC-Branding`.',
      'Diese liegt lokal unter `%APPDATA%\\Microsoft\\Templates\\WMC-Vorlage.dotx`, alle Branding-Dateien liegen zusätzlich als Zusatzdateien beim Skill `wmc-branding` in der Skills-Bibliothek.',
    ],
    [
      'Der Skill-Pfad lautet `C:\\Users\\Nurzhan Kukeyev\\Claude\\skills\\iq+eq+vq`. Bei kleinen Aufgaben genügt ein Satz je Modus, der Umfang richtet sich nach der Tragweite der Aufgabe.',
      'Der Skill `iq+eq+vq` ist in der Skills-Bibliothek verfügbar. Bei kleinen Aufgaben genügt ein Satz je Modus, der Umfang richtet sich nach der Tragweite der Aufgabe.',
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
    const count = content.split(oldText).length - 1;
    if (count === 0) {
      console.error(`  WARNUNG bei "${slug}": Text nicht gefunden:\n    ${oldText.slice(0, 80)}...`);
      continue;
    }
    content = content.split(oldText).join(newText);
    replaced += count;
  }

  if (replaced === 0) {
    console.log(`ÜBERSPRUNGEN "${slug}": keine Ersetzung nötig.`);
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
    change_note: "Personen-/rechnerspezifischen Pfad durch portable bzw. teamweit gültige Referenz ersetzt",
    created_by: createdBy,
  });

  console.log(`Aktualisiert "${slug}": ${replaced} Stelle(n) ersetzt (Version ${newVersion}).`);
}
