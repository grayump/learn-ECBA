# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A self-contained ECBA (Entry Certificate in Business Analysis) exam-prep study app. It targets IIBA's current (2025+) ECBA Blueprint V1.1 — the 9-domain, 50-question, 75-minute format.

There is **no build system, package manager, framework, or dependencies**. The entire app is `index.html` (inline CSS + vanilla JS) that `fetch()`es a set of content JSON files at runtime. `node validate.js` is the only tooling, and it uses Node's built-ins only.

## Commands

- **Run the app:** serve the folder over HTTP, then open the printed localhost URL:
  - `npx serve` or `python -m http.server`
  - It **cannot** be opened via `file://` — browsers block `fetch()` on that scheme, and the app shows a "Can't load content" screen. Deploys as-is to GitHub Pages (`.nojekyll` disables Jekyll).
- **Validate the question bank:** `node validate.js` — checks required fields/types, `d{domain}-{seq}` id pattern, duplicate ids, `correct_index` bounds, and that every `domain_id`/`activity_statement_id`/`technique_tag`/`competency_tag` resolves against `domains.json`/`techniques.json`/`competencies.json`. Exit code 1 on any error. Run this after editing any `questions_domain*.json`, `domains.json`, `techniques.json`, or `competencies.json`.
- There is no automated browser test harness. To verify UI changes end-to-end, install `jsdom` in the scratchpad, boot the app with a `fetch` mock reading local files via JSDOM's `beforeParse` hook (the inline script runs `boot()` during construction, so `window.fetch` must be injected before parse), then drive the DOM.

## Architecture

### Runtime shape (`index.html`)

Single IIFE. Four global-ish structures drive everything:

- **`DB`** — raw loaded content (`domains`, `techniques`, `competencies`, `questionsByDomain`, `referenceMap`, `readingProgress`).
- **`IDX`** — derived lookup maps built once in `buildIndexes()` (`activityById`, `techniqueByName`, `competencyByName`, `questionById`, flattened `allQuestions`). Prefer these over re-scanning `DB`.
- **`store`** — the single persisted object, serialized to `localStorage` under key `ecba-study-state-v1`. Always mutate through `saveStore()` and the dedicated setters (`markMissed`, `setFlashcardFamiliarity`, `setFlashcardNote`, `setReadingRead`); never write `localStorage` directly. `loadStore()` merges over `defaultStore()`, so **adding a new persisted field means adding it to `defaultStore()`** or older saved blobs will read `undefined`.
- **`state`** — transient UI state (`state.mode`, plus `state.session` for practice/review and `state.mock` for an in-progress exam).

**Control flow:** `boot()` fetches content → `buildIndexes()` → `loadStore()` → `renderSidebar()` + `setMode("browse")`. All navigation goes through `setMode(mode)`, which sets `state.mode`, re-renders the sidebar, and calls `render()`. `render()` is a flat dispatch on `state.mode` to a `renderX(main)` function. **To add a page:** add a nav button in `renderSidebar()`, a branch in `render()`, and the `renderX` function — mirror an existing one.

**Data loading is fault-tolerant by design.** Core files (`domains.json`, `techniques.json`, `competencies.json`) use `fetchJson` and a failure shows the error screen. Everything else — the nine `questions_domain*.json`, `reference_map.json`, `reading_progress.json` — uses `fetchJsonOrNull`; a missing file must degrade gracefully (feature hidden / empty state) and never break the app. Preserve this when adding data sources.

### Content model & data files

Data is authored by hand as JSON, not generated. Key files and their consumers:

- `domains.json` — 9 domains × 4 activity statements. Each activity statement carries `babok_source_refs[]` (rendered as chips in Browse and quiz feedback via `formatBabokRef` / `babokRefChips`). Refs may include `page`/`section` fields; `formatBabokRef` surfaces them when present.
- `questions_domain1.json`…`9.json` — the 300-question bank (one flat array per file), loaded into a single pool. Schema and target distribution are in `questions_schema.md`; ids follow `d{domain}-{seq}` zero-padded.
- `reference_map.json` — reverse of `babok_source_refs` (BABOK task → activity statement ids); powers the Reference Map view.
- `reading_progress.json` — flattened domain→activity→references list with page numbers; powers the Reading Progress tracker. **Note its field names differ from `domains.json`** (`domain_id`/`domain_name`/`activity_statement_id` vs `id`/`name`, and `references[].book`/`chapter_section` vs `babok_source_refs[].source`/`babok_ref`). It's a separate, self-contained structure — don't assume the two share a shape.
- `techniques.json` (26) / `competencies.json` (29, grouped into 6 categories) — names + BABOK page refs only. Definition/purpose fields are intentionally empty (BABOK copyright); flashcard backs show a "see BABOK p.X" placeholder until filled.

### The two numbering systems (critical gotcha)

`babok_ref` (e.g. `"3.1"`) is the **BABOK Guide's** chapter.task number. `activity_statement_id` (e.g. `"9.4"` = Domain 9, statement 4) is the **ECBA blueprint's** numbering. They are unrelated systems that coincidentally overlap near "3.1" — a matching number implies **no** relationship. Never join, sort, or cross-reference the two on numeric value. `domains.json` and `reference_map.json` carry inline warnings about this.

## Conventions

- Match the existing vanilla-JS style: no frameworks, `$` = `getElementById`, `escapeHtml()` on all interpolated content, event listeners wired after `innerHTML` assignment.
- `validate.js` is the source of truth for the question schema — when changing the schema, update the validator in the same change.
