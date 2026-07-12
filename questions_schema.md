# ECBA Question Bank Schema

Each question is a JSON object with these fields:

```json
{
  "id": "d1-001",
  "domain_id": 1,
  "activity_statement_id": "1.2",
  "technique_tag": null,
  "competency_tag": null,
  "question_type": "situational",
  "stem": "The question text presented to the candidate.",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 2,
  "explanation": "Why the correct answer is right, and briefly why the others are wrong.",
  "difficulty": "medium"
}
```

**Field notes:**
- `id`: `d{domain}-{sequence}`, zero-padded (e.g. `d1-001`, `d4-030`)
- `domain_id`: 1–9, matches `domains.json`
- `activity_statement_id`: e.g. `"1.2"` — ties the question to a specific blueprint activity statement
- `technique_tag` / `competency_tag`: name string from `techniques.json` / `competencies.json`, or `null` if not applicable
- `question_type`: `"definition"` (recall/terminology) or `"situational"` (apply-in-context, matches the new exam's dominant style)
- `correct_index`: 0-based index into `options`
- `difficulty`: `"easy"` | `"medium"` | `"hard"`

**Target distribution (300 total, proportional to exam weighting):**

| Domain | Weight | Question count |
|---|---|---|
| 1 — Understanding Business Analysis | 20% | 60 |
| 2 — Mindset for Effective Business Analysis | 14% | 42 |
| 3 — Implementing Business Analysis | 6% | 18 |
| 4 — Change | 10% | 30 |
| 5 — Need | 10% | 30 |
| 6 — Solution | 10% | 30 |
| 7 — Stakeholder | 10% | 30 |
| 8 — Value | 10% | 30 |
| 9 — Context | 10% | 30 |
| **Total** | **100%** | **300** |

**Question type mix per domain:** aim for ~40% definition / ~60% situational, since the current exam leans heavily situational — this ratio should be *higher* on situational for domains 4–9 (BACCM) and can lean more definition-heavy for domains 1–3 where terminology itself is the gap.

**Mock exam assembly:** a 50-question mock should pull questions proportional to the same weighting (10 from Domain 1, 7 from Domain 2, 3 from Domain 3, 5 each from Domains 4–9) to mirror the real exam.
