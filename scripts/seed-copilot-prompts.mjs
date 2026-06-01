/**
 * seed-copilot-prompts.mjs
 *
 * Reads all GitHub Copilot agent/instruction/skill files from both repos and
 * inserts them as prompts into all three DB schemas:
 *   promptcontrol_dev | promptcontrol_test | promptcontrol_prod
 *
 * Usage: node scripts/seed-copilot-prompts.mjs
 */

import { config } from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const TEMPLATE_REPO = 'D:\\IDEA\\Projekt\\template_repo';

const SCHEMAS = ['promptcontrol_dev', 'promptcontrol_test', 'promptcontrol_prod'];
const ADMIN_EMAIL = 'nikolaj.schefner@wamocon.com';
const ORG_SLUG = 'wamocon';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Read file content safely; return null if not found */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    console.warn(`  [warn] File not found: ${filePath}`);
    return null;
  }
}

// ─── Prompt definitions ─────────────────────────────────────────────────────
// Each entry: { slug, name, description, category, contentPath } | { ..., content }

function buildPrompts() {
  const prompts = [];

  // ── AGENTS ─────────────────────────────────────────────────────────────────

  // Agent files from this repo
  const agentFiles = [
    {
      file: path.join(REPO_ROOT, '.github', 'agents', 'anforderungsdokument.agent.md'),
      slug: 'agent-anforderungsdokument',
      name: 'Agent: Anforderungsdokument',
      description: 'Spezialisierter Agent für WAMOCON-Anforderungsdokumente (9 Kapitel + .docx). Nur Web/SaaS, nur Quellen < 1 Jahr.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'agents', 'developer.agent.md'),
      slug: 'agent-developer-standard',
      name: 'Agent: Developer (Standard)',
      description: 'Strukturierter Entwicklungsagent. 4-Phasen-Workflow: Vorbereitung, Implementierung, Verifikation, Dokumentation.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'agents', 'planner.agent.md'),
      slug: 'agent-planner',
      name: 'Agent: Planner',
      description: 'Technischer Planungsagent. Erkundet Codebase, sammelt Kontext, erstellt Implementierungsplan. Schreibt KEINEN Code.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'agents', 'reviewer.agent.md'),
      slug: 'agent-reviewer',
      name: 'Agent: Reviewer',
      description: 'Code-Review Agent mit strukturierter Checkliste: TypeScript, Next.js 16, Supabase Security, Styling, Build.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'agents', 'handbook.agent.md'),
      slug: 'agent-handbook',
      name: 'Agent: Handbook',
      description: 'Produkthandbuch-Pflege. Hält docs/manual/index.html aktuell. Nach jedem Feature aktivieren.',
    },
  ];

  for (const ag of agentFiles) {
    const content = readFile(ag.file);
    if (content) {
      prompts.push({ ...ag, category: 'Agents', content });
    }
  }

  // Template repo developer agent (different version with Vercel pre-deployment checks)
  const templateDeveloper = readFile(path.join(TEMPLATE_REPO, '.github', 'agents', 'developer.agent.md'));
  if (templateDeveloper) {
    prompts.push({
      slug: 'agent-developer-vercel',
      name: 'Agent: Developer (mit Vercel-Checkliste)',
      description: 'Developer Agent erweitert um Pre-Deployment Checks: proxy.ts, Supabase env vars, Middleware-Manifest-Verifikation.',
      category: 'Agents',
      content: templateDeveloper,
    });
  }

  // ── INSTRUCTIONS ───────────────────────────────────────────────────────────

  const instructionFiles = [
    {
      file: path.join(REPO_ROOT, '.github', 'instructions', 'nextjs.instructions.md'),
      slug: 'instruction-nextjs-16',
      name: 'Instruction: Next.js 16 App Router',
      description: 'Coding-Richtlinien für Next.js 16: Server/Client Components, async APIs (Breaking Change), Data Fetching, Routing.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'instructions', 'typescript.instructions.md'),
      slug: 'instruction-typescript',
      name: 'Instruction: TypeScript Best Practices',
      description: 'TypeScript Strict Mode: Type Safety, Patterns, Naming Conventions (PascalCase/camelCase), Enums vermeiden.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'instructions', 'tailwind.instructions.md'),
      slug: 'instruction-tailwind-v4',
      name: 'Instruction: Tailwind CSS v4',
      description: 'Tailwind CSS v4 Utility-First: Class-Reihenfolge, Responsive Design, Dark Mode, cn() Helper.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'instructions', 'supabase.instructions.md'),
      slug: 'instruction-supabase',
      name: 'Instruction: Supabase Integration',
      description: 'Supabase @supabase/ssr: Client Setup (Server vs. Browser), RLS, Migrations, Multi-Schema auf Hosted Supabase.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'instructions', 'localsupabase.instructions.md'),
      slug: 'instruction-localsupabase',
      name: 'Instruction: Local Supabase Docker Workflow',
      description: 'Lokale Supabase-Entwicklung mit Docker: Pre-Flight Checks, Migration-Versioning, Seed Data, Integration Tests.',
    },
  ];

  for (const instr of instructionFiles) {
    const content = readFile(instr.file);
    if (content) {
      prompts.push({ ...instr, category: 'Instructions', content });
    }
  }

  // ── SKILLS ─────────────────────────────────────────────────────────────────

  const skillFiles = [
    {
      file: path.join(REPO_ROOT, '.github', 'skills', 'anforderungsdokument', 'SKILL.md'),
      slug: 'skill-anforderungsdokument',
      name: 'Skill: WAMOCON Anforderungsdokument',
      description: '3 Entwicklungsprompts: Tiefenanalyse, Marketing/UX-Rework, 9-Kapitel-Anforderungsdokument (.docx).',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'skills', 'memory-merger', 'SKILL.md'),
      slug: 'skill-memory-merger',
      name: 'Skill: Memory Merger',
      description: 'Merged reife Lernfortschritte aus Domain-Memory-Dateien in Instruction-Dateien. Syntax: /memory-merger >domain [scope]',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'skills', 'next-browser', 'SKILL.md'),
      slug: 'skill-next-browser',
      name: 'Skill: next-browser CLI',
      description: 'CLI für React DevTools + Next.js Dev Overlay: Komponenten-Baum, Props, Errors, Network, Screenshots, Perf.',
    },
    {
      file: path.join(REPO_ROOT, '.github', 'skills', 'handbook', 'SKILL.md'),
      slug: 'skill-handbook',
      name: 'Skill: Handbook Maintenance',
      description: 'Pflege von docs/manual/index.html. 6-Schritt-Update-Protokoll. Placeholder-Referenz. Color Theming.',
    },
  ];

  for (const skill of skillFiles) {
    const content = readFile(skill.file);
    if (content) {
      prompts.push({ ...skill, category: 'Skills', content });
    }
  }

  // ── GLOBAL INSTRUCTIONS ────────────────────────────────────────────────────

  const promptcontrolCopilot = readFile(path.join(REPO_ROOT, '.github', 'copilot-instructions.md'));
  if (promptcontrolCopilot) {
    prompts.push({
      slug: 'global-copilot-instructions-standard',
      name: 'Global: Copilot Instructions (Standard)',
      description: 'Projektweite Basisregeln (9 Regeln): Tech-Stack, async APIs, Server Components, Supabase, Workflow-Orchestrierung.',
      category: 'Global',
      content: promptcontrolCopilot,
    });
  }

  const templateCopilot = readFile(path.join(TEMPLATE_REPO, '.github', 'copilot-instructions.md'));
  if (templateCopilot) {
    prompts.push({
      slug: 'global-copilot-instructions-proxy',
      name: 'Global: Copilot Instructions (mit Proxy-Regeln)',
      description: 'Erweitert (11 Regeln): Ergänzt Proxy.ts-Pflicht und Supabase-Env-Var-Sicherheit. Verhindert HTTP 500 auf Vercel.',
      category: 'Global',
      content: templateCopilot,
    });
  }

  return prompts;
}

// ─── Categories config ───────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Agents',       color: '#6366f1' },
  { name: 'Instructions', color: '#10b981' },
  { name: 'Skills',       color: '#f59e0b' },
  { name: 'Global',       color: '#8b5cf6' },
];

// ─── Database operations ─────────────────────────────────────────────────────

async function getOrCreateProject(client, schema, orgId, profileId) {
  const slug = 'github-copilot-prompts';

  const { rows } = await client.query(
    `SELECT id FROM ${schema}.projects WHERE slug = $1 AND org_id = $2`,
    [slug, orgId]
  );

  if (rows.length > 0) {
    console.log(`  Project already exists: ${rows[0].id}`);
    return rows[0].id;
  }

  const { rows: created } = await client.query(
    `INSERT INTO ${schema}.projects (org_id, name, description, slug, created_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      orgId,
      'GitHub Copilot Prompts',
      'Alle GitHub Copilot Agent-Definitionen, Instructions, Skills und globale Systemanweisungen für WAMOCON-Projekte.',
      slug,
      profileId,
    ]
  );
  console.log(`  Created project: ${created[0].id}`);
  return created[0].id;
}

async function getOrCreateCategories(client, schema, orgId, projectId) {
  const catMap = {};

  for (const cat of CATEGORIES) {
    const { rows } = await client.query(
      `SELECT id FROM ${schema}.prompt_categories WHERE name = $1 AND project_id = $2`,
      [cat.name, projectId]
    );

    if (rows.length > 0) {
      catMap[cat.name] = rows[0].id;
    } else {
      const { rows: created } = await client.query(
        `INSERT INTO ${schema}.prompt_categories (org_id, project_id, name, color)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [orgId, projectId, cat.name, cat.color]
      );
      catMap[cat.name] = created[0].id;
      console.log(`  Created category: ${cat.name}`);
    }
  }

  return catMap;
}

async function upsertPrompt(client, schema, prompt, projectId, orgId, profileId, categoryId) {
  await client.query(
    `INSERT INTO ${schema}.prompts
       (project_id, org_id, name, slug, description, content, category_id, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
     ON CONFLICT (project_id, slug) DO UPDATE SET
       name        = EXCLUDED.name,
       description = EXCLUDED.description,
       content     = EXCLUDED.content,
       category_id = EXCLUDED.category_id,
       updated_at  = now()`,
    [projectId, orgId, prompt.name, prompt.slug, prompt.description, prompt.content, categoryId, profileId]
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  seed-copilot-prompts: GitHub Copilot Prompts    ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // 1. Build prompt definitions (reads files now)
  console.log('Reading source files...');
  const prompts = buildPrompts();
  console.log(`  Loaded ${prompts.length} prompts:\n`);

  const byCategory = {};
  for (const p of prompts) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p.name);
  }
  for (const [cat, names] of Object.entries(byCategory)) {
    console.log(`  [${cat}]`);
    for (const n of names) console.log(`    - ${n}`);
  }
  console.log();

  // 2. Connect to DB
  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to database.\n');

  const results = [];

  // 3. Process each schema
  for (const schema of SCHEMAS) {
    console.log(`\n──────────────────────────────────────────────────`);
    console.log(`Schema: ${schema}`);
    console.log(`──────────────────────────────────────────────────`);

    try {
      // Find org
      const { rows: orgRows } = await client.query(
        `SELECT id FROM ${schema}.organizations WHERE slug = $1`,
        [ORG_SLUG]
      );
      if (orgRows.length === 0) {
        console.log(`  [skip] Organization '${ORG_SLUG}' not found.`);
        results.push({ schema, status: 'skipped', reason: 'org not found' });
        continue;
      }
      const orgId = orgRows[0].id;
      console.log(`  Org:     ${orgId}`);

      // Find admin profile
      const { rows: profileRows } = await client.query(
        `SELECT id FROM ${schema}.profiles WHERE email = $1`,
        [ADMIN_EMAIL]
      );
      if (profileRows.length === 0) {
        console.log(`  [skip] Profile '${ADMIN_EMAIL}' not found.`);
        results.push({ schema, status: 'skipped', reason: 'profile not found' });
        continue;
      }
      const profileId = profileRows[0].id;
      console.log(`  Profile: ${profileId}`);

      // Create project
      const projectId = await getOrCreateProject(client, schema, orgId, profileId);
      console.log(`  Project: ${projectId}`);

      // Create categories
      const catMap = await getOrCreateCategories(client, schema, orgId, projectId);

      // Upsert all prompts
      let inserted = 0;
      for (const prompt of prompts) {
        const categoryId = catMap[prompt.category];
        await upsertPrompt(client, schema, prompt, projectId, orgId, profileId, categoryId);
        inserted++;
        process.stdout.write(`\r  Prompts: ${inserted}/${prompts.length} upserted`);
      }
      console.log();

      results.push({ schema, status: 'ok', prompts: inserted });
    } catch (err) {
      console.error(`  [error] ${err.message}`);
      results.push({ schema, status: 'error', error: err.message });
    }
  }

  await client.end();

  // 4. Summary
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════');
  for (const r of results) {
    const icon = r.status === 'ok' ? '✓' : r.status === 'skipped' ? '~' : '✗';
    const detail = r.status === 'ok'
      ? `${r.prompts} prompts seeded`
      : r.reason || r.error || '';
    console.log(`  ${icon}  ${r.schema.padEnd(25)} ${detail}`);
  }
  console.log();

  const errors = results.filter(r => r.status === 'error');
  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
