# ProCon - KI-Prompt-Management

> Zentrale Verwaltung von KI-System-Prompts fuer Teams.  
> Versionierung, Freigabe, Compliance-Scanner und REST-API in einer SaaS-Plattform.

[![Unit Tests](https://github.com/your-org/promptcontrol/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/your-org/promptcontrol/actions/workflows/unit-tests.yml)
[![Validation](https://github.com/your-org/promptcontrol/actions/workflows/validation.yml/badge.svg)](https://github.com/your-org/promptcontrol/actions/workflows/validation.yml)

---

## Tech-Stack

| Schicht | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) |
| Sprache | TypeScript 5.x (strict) |
| Styling | Tailwind CSS v4 |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| i18n | next-intl 4.x (DE + EN) |
| Tests | Vitest 4.x + Testing Library |
| Deployment | Vercel |

---

## Lokale Entwicklung

### Voraussetzungen

- Node.js >= 20
- npm >= 10
- Supabase-Projekt (gehostet oder lokal via Docker)

### Setup

```bash
# 1. Repository klonen
git clone https://github.com/your-org/promptcontrol
cd promptcontrol

# 2. Abhaengigkeiten installieren
npm install

# 3. Environment-Variablen anlegen
cp .env.example .env.local
# -> .env.local befuellen (siehe unten)

# 4. Entwicklungsserver starten
npm run dev
```

---

## Environment-Variablen

```env
# Supabase (oeffentlich - wird im Browser sichtbar)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Datenbankschema (dev | test | prod)
NEXT_PUBLIC_DB_SCHEMA=promptcontrol_dev

# Supabase Server-only (niemals NEXT_PUBLIC_!)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## Supabase-Schema

Das Projekt nutzt **drei parallele Schemata** in einem Supabase-Projekt:

| Schema | Zweck |
|---|---|
| `promptcontrol_dev` | Lokale Entwicklung |
| `promptcontrol_test` | CI/CD-Tests |
| `promptcontrol_prod` | Produktion |

Migration ausfuehren:

```bash
node scripts/migrate.mjs
```

---

## Verfuegbare Scripts

```bash
npm run dev           # Entwicklungsserver starten
npm run build         # Produktions-Build
npm run start         # Produktions-Build starten
npm run lint          # ESLint
npm run typecheck     # TypeScript-Pruefung
npm run test          # Unit-Tests (Vitest)
npm run test:watch    # Tests im Watch-Modus
npm run test:coverage # Coverage-Report
npm run verify        # lint + typecheck + build
```

---

## Projektstruktur

```
src/
  app/
    [locale]/           # Sprachrouting (de / en)
      dashboard/        # Authenticated Bereich
        admin/          # Admin-only (Rolle: admin)
        profile/        # Profileinstellungen
        projects/       # Projektverwaltung
        team/           # Teamverwaltung (Pro)
      auth/             # Login / Registrierung
      legal/            # Impressum, Datenschutz, AGB
    api/
      v1/prompts/       # REST-API (slug-basiert)
      mcp/              # MCP-Endpunkt
  components/           # Wiederverwendbare UI-Komponenten
  i18n/                 # next-intl Konfiguration
  lib/supabase/         # Supabase-Clients (client/server/middleware)
  __tests__/            # Unit-Tests
messages/
  de.json               # Deutsche Uebersetzungen
  en.json               # Englische Uebersetzungen
supabase/
  migrations/           # SQL-Migrationen
.github/workflows/      # CI/CD-Pipelines
docs/manual/            # Produkthandbuch (GitHub Pages)
```

---

## CI/CD-Pipelines

| Workflow | Trigger | Aufgabe |
|---|---|---|
| `unit-tests.yml` | Jeder Push / PR | 72+ Unit-Tests + Coverage |
| `validation.yml` | Jeder Push / PR | TypeScript, ESLint, Build |
| `deploy-preview.yml` | PR -> main | Vercel Preview-Deployment |
| `deploy-production.yml` | Merge -> main | Vercel Produktions-Deployment |
| `publish-handbook.yml` | Aenderungen in docs/ | GitHub Pages Handbook |

**Kein Doppel-Run:** Concurrency-Gruppen stellen sicher, dass Push- und PR-Sync-Events denselben Commit nicht doppelt testen.

---

## Nutzerrollen

| Rolle | Beschreibung |
|---|---|
| `trainee` | Lesen, API nutzen |
| `developer` | Prompts erstellen und bearbeiten |
| `pm` | Projekte und Team verwalten |
| `admin` | Voller Zugriff + Adminbereich |

---

## REST-API

```http
GET /api/v1/prompts/{projekt-slug}/{prompt-slug}
Authorization: Bearer {API_KEY}
X-Schema: promptcontrol_prod
```

---

## Produkthandbuch

Das vollstaendige Handbuch ist unter GitHub Pages verfuegbar:  
`https://your-org.github.io/promptcontrol/manual/`

Lokal: `docs/manual/index.html`

---

## Lizenz

Copyright (c) 2026 WAMOCON GmbH. Alle Rechte vorbehalten.
