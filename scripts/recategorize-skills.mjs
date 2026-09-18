// @ts-check
// Ordnet Skills aus den beiden Herkunfts-Sammelkategorien
// "Marketplace-Skills" und "Claude-Standard-Skills" fachlichen Bereichen
// zu (Softwareentwicklung, Test, Design, ...), per Namensmuster. WMC,
// Projekt-intern und Copilot-Instructions bleiben unangetastet, das sind
// organisatorische, keine fachlichen Kategorien.
//
// Aufruf (Werte zeigen auf die selbst gehostete Instanz):
//   SUPABASE_URL=http://192.168.178.136:54321 \
//   SUPABASE_SERVICE_ROLE_KEY=*** \
//   SUPABASE_SCHEMA=promptcontrol_prod \
//   node scripts/recategorize-skills.mjs

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SUPABASE_SCHEMA ?? "promptcontrol_prod";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { db: { schema: SCHEMA } });

const REASSIGN_SOURCE_CATEGORIES = ["Marketplace-Skills", "Claude-Standard-Skills", "Sonstiges"];

// Reihenfolge entscheidet: die erste passende Regel gewinnt, deshalb
// stehen spezifischere Muster (Design, Test, WMC) vor dem breiten
// Softwareentwicklung-Auffangbecken.
const RULES = [
  { category: "WMC", color: "#f59e0b", pattern: /^wmc-|^iq[-+]eq[-+]vq$/ },
  { category: "Design & UI/UX", color: "#ec4899", pattern: /design|frontend|ui-ux|diagram|excalidraw|napkin|dataviz|nano-banana|google-stitch|plantuml|image-manipulation/ },
  { category: "Test & QA", color: "#22c55e", pattern: /\bqa\b|test|accessibility|benchmark|playwright|pytest|secret-scanning|security-review|doublecheck|quality-playbook|eval-driven-dev|scoutqa|dependabot/ },
  { category: "DevOps & Deployment", color: "#0ea5e9", pattern: /deploy|docker|devops|rollout|canary|\bship\b|land-and-deploy|setup-deploy|setup-env-keys|\bfreeze\b|unfreeze|multi-stage/ },
  { category: "Dokumentation", color: "#f59e0b", pattern: /readme|documentation|\bdocs\b|docx|\bpdf\b|pptx|xlsx|handbook|meeting-minutes|technical-spike|architectural-decision-record|markdown-to-html|update-llms|create-llms|document-generate|document-release|blueprint-generator|generate-custom-instructions|gen-specs/ },
  { category: "Projektmanagement", color: "#a855f7", pattern: /breakdown|\bprd\b|\bspec\b|specification|implementation-plan|project-management|project-bootstrap|project-workflow|retro|roundup|plan-|\bepic\b/ },
  { category: "Marketing & GTM", color: "#f43f5e", pattern: /gtm-|seo|marketing|landing-report|sponsor-finder/ },
  { category: "KI-Agenten & Automatisierung", color: "#6366f1", pattern: /agent|autonomy|autoresearch|autoplan|langgraph|llm-|mlops|model-recommendation|chatbot|memory-merger|memory-mem0|prompt-builder|pair-agent|\bcodex\b|copilot-sdk|mcp-server-generator|skill-creator|skillify|make-skill-template|find-skills|import-memory/ },
  { category: "Mobile & iOS", color: "#14b8a6", pattern: /^ios-/ },
  { category: "Softwareentwicklung", color: "#6366f1", pattern: /refactor|review|git-|github|\bcode\b|sql|postgresql|database|api-design|architecture|cloud-design|system-design|technology-stack|folder-structure|editorconfig|conventional-commit|next-intl|supabase|typescript|javascript|python|\bschema\b|performance|context-map|context-restore|context-save|repo-story|make-repo-contribution|quasi-coder|web-quality-audit|site-architecture|data-engineering|data-science|gh-cli|cli-mastery|copilot-cli|chrome-devtools|\bbrowse\b|\bscrape\b|setup-browser-cookies|web-coder|my-issues|my-pull-requests|gstack/ },
];

function categorize(slug) {
  const s = slug.toLowerCase();
  for (const rule of RULES) {
    if (rule.pattern.test(s)) return rule.category;
  }
  return "Sonstiges";
}

const { data: sourceCats } = await supabase
  .from("skill_categories")
  .select("id, name")
  .in("name", REASSIGN_SOURCE_CATEGORIES);

if (!sourceCats?.length) {
  console.log("Keine der Herkunfts-Kategorien gefunden, nichts zu tun.");
  process.exit(0);
}
const sourceIds = sourceCats.map((c) => c.id);

const { data: skills, error } = await supabase
  .from("skills")
  .select("id, slug, org_id")
  .in("category_id", sourceIds);

if (error) {
  console.error("Fehler beim Laden der Skills:", error.message);
  process.exit(1);
}
console.log(`${skills.length} Skills werden neu einsortiert.`);

const orgId = skills[0]?.org_id;
const targetCategoryId = new Map(); // name -> id
const counts = new Map();

for (const skill of skills) {
  const catName = categorize(skill.slug);
  let catId = targetCategoryId.get(catName);
  if (!catId) {
    const { data: existing } = await supabase
      .from("skill_categories")
      .select("id")
      .eq("org_id", orgId)
      .eq("name", catName)
      .maybeSingle();
    if (existing) {
      catId = existing.id;
    } else {
      const color = RULES.find((r) => r.category === catName)?.color ?? "#71717a";
      const { data: created, error: createErr } = await supabase
        .from("skill_categories")
        .insert({ org_id: orgId, name: catName, color })
        .select("id")
        .single();
      if (createErr) {
        console.error(`Kategorie "${catName}" konnte nicht angelegt werden:`, createErr.message);
        continue;
      }
      catId = created.id;
    }
    targetCategoryId.set(catName, catId);
  }

  const { error: updateErr } = await supabase
    .from("skills")
    .update({ category_id: catId })
    .eq("id", skill.id);
  if (updateErr) {
    console.error(`"${skill.slug}" konnte nicht aktualisiert werden:`, updateErr.message);
    continue;
  }
  counts.set(catName, (counts.get(catName) ?? 0) + 1);
}

// Leer gewordene Herkunfts-Kategorien aufräumen
for (const cat of sourceCats) {
  const { count } = await supabase
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("category_id", cat.id);
  if (!count) {
    await supabase.from("skill_categories").delete().eq("id", cat.id);
    console.log(`Leere Kategorie "${cat.name}" entfernt.`);
  }
}

console.log("\n=== Verteilung ===");
for (const [name, n] of [...counts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`${name}: ${n}`);
}
