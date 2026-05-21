# Skill: handbook

## Purpose

Maintain the product handbook at `docs/manual/index.html` so it always reflects the current state of the application.
The handbook is deployed as a static GitHub Pages site. It is the single source of truth for end-users, stakeholders, and team members.

---

## When to activate this skill

Activate **automatically** whenever any of the following events occur:

| Event | Action |
|---|---|
| New page / route added to `src/app/` | Add route to Section 05 (Routen-Ubersicht) |
| New API route added to `src/app/api/` | Add endpoint to Section 05.2 (API & Hooks) |
| New Supabase migration applied | Update Section 06.2 (Datenbank-Schema) |
| New feature implemented | Add feature card (Section 01) and table row (Section 02) |
| Plan/pricing changed | Update Section 02.2 (Plane & Preise) |
| New GitHub Actions workflow added | Update Section 07 (CI/CD & Tests) |
| DSGVO/legal update | Update Section 08 (DSGVO & Compliance) |
| Domain-specific terms introduced | Extend Section 09 (Glossar) |
| App name, logo, colors, or branding changed | Update CSS variables, header logo, meta comment, and footer |

---

## Handbook File Location

```
docs/
  index.html          <- redirect to manual/
  manual/
    index.html        <- THE handbook (this file is maintained by this skill)
```

---

## Placeholder Convention

The handbook uses `[PLACEHOLDER]` markers in HTML comments and content.
Copilot MUST replace all placeholders with real values when implementing a project.

| Placeholder | Replace with |
|---|---|
| `[APP_NAME]` | The actual app name (e.g. "Auktivo") |
| `[APP_TAGLINE]` | Short one-line description of the app |
| `[APP_VERSION]` | Current semver version from `package.json` |
| `[APP_URL]` | Production URL of the app |
| `[APP_DESCRIPTION]` | 1-2 sentence functional description |
| `[PROBLEM_STATEMENT]` | The core problem the app solves |
| `[PLAN_NAMES]` | Names of available plans (e.g. "Free · Pro") |
| `[PRO_PRICE]` | Pro plan price (e.g. "9,99 EUR/Monat") |
| `[LAST_UPDATED]` | Current month and year (e.g. "Mai 2026") |
| `[PRIMARY_COLOR]` | Hex color matching the app's primary brand color |
| `[PRIMARY_DARK]` | Darker shade for hover states |
| `[LOGO_EMOJI]` | Emoji or letter representing the app logo |
| `[DB_SCHEMA]` | Supabase schema name |
| `[DB_SCHEMA_DEV]` | Supabase dev schema name |
| `[DB_SCHEMA_PROD]` | Supabase prod schema name |
| `[FEATURE_1-4_TITLE/DESC]` | Real feature names and descriptions |
| `[FREE_ROLE_DESC]` | What free users can do |
| `[PRO_ROLE_DESC]` | What pro users can do |
| `[FEATURE_LIST_INTRO]` | Intro sentence for features section |
| `[FEATURE_A/B/C/D_PRO]` | Actual feature names in pricing table |
| `[STEP_1/2/3]` | Actual first-run tutorial steps |

---

## Color Theming Rules

The CSS variables in `:root` must match the app's actual color palette:

```css
:root {
  --primary:      #XXXXXX;   /* app's primary brand color */
  --primary-dark: #XXXXXX;   /* darker shade for hover */
  --primary-glow: rgba(R,G,B,0.18);
}
```

To find the app's primary color:
1. Check `src/app/globals.css` for Tailwind color variables
2. Check `tailwind.config.ts` for custom color definitions
3. Check the logo component in `src/components/` or `src/app/layout.tsx`

The logo mark gradient and box-shadow must also reflect the brand color.

---

## Update Protocol (step by step)

When Copilot detects a change that requires a handbook update, follow these steps:

### Step 1 - Read current handbook
```
read_file docs/manual/index.html
```

### Step 2 - Identify stale sections
Compare the handbook content against:
- `src/app/` directory structure (for routes)
- `src/app/api/` (for API endpoints)
- `supabase/migrations/` (for schema)
- `package.json` version field
- Recent conversation/plan context (for new features)

### Step 3 - Determine the minimal diff
Only update the sections that are actually stale. Do NOT rewrite sections that are already accurate.

### Step 4 - Apply surgical updates
Use `replace_string_in_file` to update only the changed HTML fragments.
Never regenerate the entire file unless a full redesign is explicitly requested.

### Step 5 - Update the meta comment and footer
Always update these two fields after any change:
- `APP_VERSION` in the meta comment at the top (match `package.json`)
- `LAST_UPDATED` in the meta comment and footer (use current month + year)
- Footer version string: `[APP_NAME] Produkthandbuch v[APP_VERSION] · Vertraulich · [LAST_UPDATED]`

### Step 6 - Verify HTML validity
Ensure:
- All opened tags are closed
- No broken HTML entities (e.g. `&amp;` not `&`)
- All `[PLACEHOLDER]` values are replaced (no brackets left in visible content)
- Sidebar TOC links match the actual section IDs in the page

---

## Branding Update Protocol

When the app logo, name, or colors change:

1. Update CSS `:root` variables (`--primary`, `--primary-dark`, `--primary-glow`)
2. Update the `.cover::before` radial gradient rgba values
3. Update `.logo-mark` gradient colors
4. Update `.logo-mark` box-shadow rgba values
5. Update `tr:hover td` background rgba values
6. Update `<title>` tag: `[APP_NAME] - Produkthandbuch | WAMOCON`
7. Update `.brand-name` text: `[APP_NAME]`
8. Update `.cover h1` text: `[APP_NAME]`
9. Update `.logo-mark` inner emoji/letter
10. Update meta comment at top of file

---

## TOC Sync Rules

The sidebar TOC (`#toc-sidebar`) must always match the actual sections in `<main>`:
- Every `<section id="X">` must have a corresponding `<a class="toc-link l1" href="#X">` in the sidebar
- Every `<h3 id="Y">` within a section must have a `<a class="toc-link l2" href="#Y">` below the l1 link
- Remove TOC entries for sections that have been removed
- Add TOC entries for newly added sections

---

## PDF Download - Do Not Remove

The "PDF speichern" button uses `window.print()`. This is intentional and must not be removed.
The print CSS (`@media print`) must hide sidebar, position header as static, and render a clean printable layout.

The "OneDrive" button opens a modal with save instructions. This must not be removed.

---

## Quality Checklist (run before declaring handbook update complete)

- [ ] All `[PLACEHOLDER]` markers replaced with real values in visible content
- [ ] Sidebar TOC matches all section IDs
- [ ] HTML is valid (no unclosed tags, no broken entities)
- [ ] CSS `:root` colors match the app's brand
- [ ] Logo emoji/letter is correct
- [ ] Version and date are current
- [ ] PDF download button present and functional
- [ ] OneDrive modal present and functional
- [ ] Footer copyright and version string updated
- [ ] Section 05 (routes) reflects actual `src/app/` structure
- [ ] Section 06.2 (schema) reflects latest Supabase migrations
