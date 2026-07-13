# ECBA Study App — Content Package

Content foundation for an ECBA (Entry Certificate in Business Analysis) study app,
built from IIBA's current (2025+) ECBA Exam Blueprint V1.1 — the new 9-domain,
50-question, 75-minute format.

## Files in this package

- `domains.json` — all 9 exam domains, weightings, and activity statements (official, verbatim from IIBA blueprint). Each activity statement now carries a `babok_source_refs` array pulled from IIBA's official ECBA Reference Map — the BABOK task(s) that statement draws from (domains 1–3 cite the Business Analysis Standard)
- `reference_map.json` — the official reference map in its own structure (BABOK Guide task → which activity statement(s) it supports); the reverse lookup of the `babok_source_refs` above. Powers the app's Reference Map view
- `techniques.json` — the 20 in-scope BABOK techniques (names/refs confirmed; purpose/description fields intentionally left for you to populate from the BABOK Guide directly, to respect BABOK copyright)
- `competencies.json` — all 29 underlying competencies, grouped by category
- `questions_schema.md` — data schema + target distribution for the question bank
- `questions_domain1.json` through `questions_domain9.json` — the complete 300-question bank, proportional to exam weighting:
  - Domain 1 (Understanding Business Analysis): 60
  - Domain 2 (Mindset for Effective Business Analysis): 42
  - Domain 3 (Implementing Business Analysis): 18
  - Domain 4 (Change): 30
  - Domain 5 (Need): 30
  - Domain 6 (Solution): 30
  - Domain 7 (Stakeholder): 30
  - Domain 8 (Value): 30
  - Domain 9 (Context): 30
  - **Total: 300**, each tagged with domain, activity statement, technique/competency (where relevant), question type, and difficulty
- `index.html` — the study app: Browse Domains, Reference Map, Flashcards (techniques/competencies), Practice by Domain, Mock Exam, Review Missed Questions. Browse Domains and quiz feedback surface each activity statement's `babok_source_refs`, and the Reference Map view renders `reference_map.json` (BABOK task → activity statement). Fetches the JSON files above at runtime, so it needs to be served over local HTTP to test (e.g. `npx serve` or `python -m http.server` in this folder — double-clicking the file won't work, browsers block `fetch()` on `file://`). Works natively on GitHub Pages.
- `validate.js` — run `node validate.js` to check the question bank against the schema above (required-field/type checks, duplicate-id detection, `correct_index` bounds, domain/activity cross-references, technique/competency tag resolution) before adding new content

## A note on numbering

The `babok_ref` values in `domains.json`/`reference_map.json` use the BABOK Guide's own chapter.task numbering (e.g. task **3.1 Plan Business Analysis Approach**), which is a **completely separate** system from the ECBA blueprint's `activity_statement_id` (e.g. **9.4** = Domain 9 Context, statement 4). The two coincidentally overlap in places (both start counting near "3.1"), but a matching number implies no relationship. The Reference Map view carries this warning inline.

## 4-Week Study Plan

**Week 1 — Foundational domains (1–3)**
Domains 1–3 = 40% of the exam and the least like your existing intuitive BA knowledge — new IIBA vocabulary (BACCM, activity statements, "job-ready competency" framing). Priority: master the six BACCM concept definitions cold (Domain 1.2) since every later domain depends on correctly identifying which BACCM concept a scenario is testing.
- Study: Domain 1 → 2 → 3, in order
- Drill: definition flashcards for all 6 BACCM concepts, all 20 techniques (names + one-line purpose), all 29 competencies (grouped by category)
- Practice: domain-filtered quizzes, ~60/42/18 questions respectively

**Week 2 — BACCM domains 4–6 (Change, Need, Solution)**
- Practice: situational scenario sets, ~30 questions each
- Drill pattern: for every scenario, force yourself to name the BACCM concept before answering — this is the core exam skill

**Week 3 — BACCM domains 7–9 (Stakeholder, Value, Context)**
- Practice: situational scenario sets, ~30 questions each
- Add mixed-domain sets (scenarios that could plausibly hinge on 2+ concepts) since real exam items often require discriminating between similar-looking options

**Week 4 — Full mock exams + review**
- 3–4 full 50-question, 75-minute timed simulations, weighted proportionally across all 9 domains (see distribution table in `questions_schema.md`)
- Error log by domain — after each mock, tag every miss by domain and activity statement, not just "wrong"
- Final 48 hours: light review only, no new material

## Content status: question bank complete

All 300 questions are built and validated — one JSON file per domain, proportional to the official exam weighting. Ready for Claude Code to consume directly.

**Remaining content gap:** technique and competency *definitions* (purpose/description/usage considerations/effectiveness measures) are still names + BABOK page references only — that detail needs to come from your own BABOK Guide v3 copy (not reproduced here due to copyright). Paste the relevant passages to me and I'll help turn them into original, exam-ready study notes, or fill them in yourself using the page numbers already provided in `techniques.json` and `competencies.json`.

**For the Claude Code build**, the app should:
1. Load all 9 `questions_domain*.json` files into a single practice pool
2. Support domain-filtered practice (e.g., "just Domain 1" for Week 1 focus)
3. Assemble 50-question mock exams by sampling proportionally across domains (10/7/3/5×6 — see `questions_schema.md`)
4. Track per-question performance for a spaced-repetition error log, tagged by `domain_id` and `activity_statement_id` so weak spots are visible at the activity-statement level, not just the domain level
5. Surface `technique_tag`/`competency_tag` on relevant questions as a light cross-reference once those glossaries are filled in
