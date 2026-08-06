# Future Enhancements

Ideas that have been scoped out but deliberately deferred. Each entry should read
standalone — a future reader shouldn't need the original conversation for context.

## Word-matching practice, driven by flashcard answers

**Origin idea:** a "match the word to its definition" exercise (e.g. matching an
activity-statement-style description to the right term), originally imagined
around BA-Standard principles — e.g. matching "Identify core business analysis
principles" (domain 2 activity statement 2.3) to a named principle from p.11 of
the Business Analysis Standard.

**Why deferred:** no principles list or page-11 text exists anywhere in this repo,
and authoring paraphrased descriptions for 26 techniques + 29 competencies +
principles is a real content-creation project with real accuracy risk — none of
that source text can be verified against a copy of the book from inside this repo.

**Better-scoped version, for later:** build the matching quiz on top of content
that already exists — the free-text "Answer" notes users type into flashcards
(`store.flashcardNotes`, keyed `"technique:Name"` / `"competency:Name"`, added in
commit a138856). No new JSON content or `validate.js` changes needed; the pool of
matchable items grows automatically as notes get filled in during normal study.

Design sketch:

- Add a "Practice matching" button + live "N of M answered" count to each
  Flashcards deck page (Techniques/Competencies), enabled once at least 3 cards
  in that deck have a non-empty note.
- Reuse the existing session engine (`state.session`, `renderQuizEngine`,
  `renderSessionSummary`) via a `state.session.kind === "match"` branch, instead
  of a parallel implementation.
- Each question shows one note as the prompt; a `<select>` offers the correct
  term + 4 distractors sampled from the *full* deck name list (not just the
  populated subset), so it works even with only a few notes filled in.
- Keep matching results scored session-locally only (correct count / missed-this-
  session / end-of-session summary) — do **not** wire into the persistent
  cross-session `store.missed` "Review Missed" system, since flashcard notes are
  user-editable/deletable and could go stale as a persisted reference. Session-
  local "review these now" still works after generalizing
  `renderSessionSummary`'s missed-review lookup to filter `s.pool` directly
  instead of doing a global `IDX.allQuestions` lookup (a small, behavior-
  preserving tweak either way, and worth doing regardless of this feature).
- Touches only `index.html`: a new `startMatchingSession(kind)`, a new
  `renderMatchItem(main, s)`, a branch at the top of `renderQuizEngine`, a
  button + live counter added to `renderFlashcards`, and a small CSS rule for
  the `<select>` (mirroring the existing `.notes-controls select` styling).

## Rich text (bold/underline) in Reading Progress notes

**Origin idea:** let bold and underline formatting into the per-activity-statement
notes on the Reading Progress page (`renderReadingProgress`, index.html:737-804),
so notes can visually emphasize key terms the way a real study notebook would.
Bulleting is intentionally out of scope — the user is happy to type `-` by hand
for bullets, so no list UI/markup is needed.

**Why deferred:** scoped and designed, not yet built. Recorded here so the
design doesn't need to be re-derived later.

**Chosen approach — `contenteditable` editor, HTML storage** (over a
markdown-shorthand textarea): a `contenteditable` div gets Ctrl+B/Ctrl+U for
free from the browser (no custom keydown handling needed), and typed text
renders bold/underlined immediately as you type, rather than showing literal
`**`/`<u>` characters until a separate render pass. The cost is that
`store.readingNotes` values become HTML strings instead of plain text, which
pushes conversion work onto the Markdown export and print paths (both detailed
below). `store.flashcardNotes` and the flashcard note textarea
(`renderFlashcards`, index.html:893-1006) are unaffected — this is scoped to
Reading Progress notes only.

Design sketch:

- **Editor markup** — replace the `<textarea class="reading-note" ...>` at
  index.html:776 with `<div class="reading-note" contenteditable="true"
  data-note-act="..." data-placeholder="Write definitions, notes…">`. Inject
  the stored HTML directly (not `escapeHtml`-ed, since it's now HTML produced
  by this same editor). Add small Bold/Underline toolbar buttons above the div
  calling `document.execCommand('bold')` / `('underline')` — Ctrl+B/Ctrl+U
  work without them, but buttons make the feature discoverable.
- **Simpler Enter-key behavior** — call
  `document.execCommand('defaultParagraphSeparator', false, 'br')` once at
  boot so pressing Enter inside the editor inserts `<br>` rather than
  browser-default nested `<div>`/`<p>` wrapping, keeping the HTML shape small
  and predictable for the Markdown converter below.
- **Paste handling** — intercept the `paste` event, `preventDefault()`, and
  insert only the plain-text clipboard payload (`e.clipboardData.getData(
  "text/plain")`) via `execCommand('insertText', ...)`. This avoids needing a
  general HTML sanitizer for arbitrary pasted markup (Word styles, spans,
  images) — pasted text always arrives plain, and the user can re-apply
  bold/underline with Ctrl+B/Ctrl+U afterward. Combined with the editor only
  ever producing `<strong>`/`<b>`, `<u>`, and `<br>` itself, the resulting HTML
  is always a small, known-safe vocabulary — no sanitizer library needed.
- **Save path** — on `blur`, replace the current
  `setReadingNote(ta.dataset.noteAct, e.target.value)` (index.html:800) with a
  version that reads `el.innerHTML`, and treats the note as empty based on
  `el.textContent.trim()` (not the HTML string) so a lone `<br>` doesn't count
  as content. `setReadingNote` itself (index.html:436-440) needs no change —
  it already trims/deletes based on the value it's given.
- **Backward compatibility with existing plain-text notes** — no migration
  needed. Old `readingNotes` values are plain strings with `\n` line breaks
  and no tags; injected as HTML they're inert text, so keep `white-space:
  pre-wrap` on `.reading-note` (already present, index.html:255) so old
  newlines still visually break lines even though they aren't real `<br>`
  tags. New notes get real `<br>` tags going forward; harmless overlap.
- **Study Notes / print view** — `renderStudyNotes` (index.html:823-890),
  specifically the `note-body` line (index.html:858), currently does
  `${note ? escapeHtml(note) : "(no notes yet)"}`. Change to inject `note`
  directly (`${note || "(no notes yet)"}`) since it's now pre-sanitized HTML
  from a controlled vocabulary, not raw user text.
- **Markdown export conversion** — `buildNotesMarkdown` (index.html:807-821)
  currently pushes `store.readingNotes[...]` verbatim as the export line
  (index.html:817). Add a small `htmlNoteToMarkdown(html)` helper and call it
  there instead. Because the stored HTML vocabulary is deliberately tiny
  (`<strong>`/`<b>`, `<u>`, `<br>`/`<div>`, plain text — nothing else can get
  in via the editor or paste handling above), simple regex/string replacement
  is sufficient and doesn't need a general HTML parser:
  - `<strong>...</strong>` / `<b>...</b>` → `**...**`
  - `<u>...</u>` → left as literal `<u>...</u>` (Markdown has no native
    underline syntax, but raw inline HTML passes through unchanged in
    CommonMark, so this stays valid, readable Markdown)
  - `<br>` and `</div><div>` boundaries → `\n`; remaining `<div>`/`</div>`
    wrapper tags stripped
- **Markdown import conversion** — the Study Notes page now has an Import
  Markdown feature (`parseNotesMarkdown` + `applyPendingImport`), which
  writes parsed *Markdown* text straight into `store.readingNotes` via
  `setReadingNote`. Once notes are HTML, that path needs the inverse of
  `htmlNoteToMarkdown` — a `markdownNoteToHtml(md)` applied to each parsed
  note before it's stored (`**text**` → `<strong>`, `<u>…</u>` passed
  through, `\n` → `<br>`), or imported notes will display their raw
  `**asterisks**` as literal text. Round-tripping is only guaranteed for
  files this app's own exporter produced.
- **CSS** — add `.reading-note[contenteditable]:empty::before { content:
  attr(data-placeholder); color: var(--muted); }` (contenteditable has no
  native `placeholder` attribute support) plus a focus-visible outline and
  small toolbar button styling, near the existing `.reading-note` rule
  (index.html:255).
- **Verification** — no automated browser harness exists for this app (per
  CLAUDE.md); test by hand: type + Ctrl+B/Ctrl+U toggle, Enter for new lines,
  reload the page and confirm the note persists via `localStorage`
  (`ecba-study-state-v1`), confirm a pre-existing plain-text note (saved
  before this change) still displays correctly, check the Study Notes list
  and Print view render bold/underline, and check Export Markdown produces
  `**bold**` / `<u>underline</u>` in the downloaded `.md` file. `node
  validate.js` is unaffected (question-bank/domain schema only) but worth a
  sanity run since it's the project's only tooling.
