# Feature Pipeline: Spec-Driven Development (SDD)

This document defines the process for implementing patchnotes, bug fixes, and new features in CTML using Spec-Driven Development principles.

## What is Spec-Driven Development?

SDD is a discipline where:
- **Spec first**: Write a clear specification before any code is touched.
- **Explore patterns**: Understand the codebase before planning (naming, data flow, state mutations).
- **Plans are self-contained**: Implementation plans include file paths, existing functions to reuse, patterns to follow, and acceptance criteria.
- **Human approval gate**: No implementation begins until a human explicitly approves the plan.
- **Verification is explicit**: Every task has a clear "how to verify it's correct" step.
- **Scope is stated**: What is NOT being built is as important as what is.

## Pipeline Steps

### 1. SPEC
Write a brief specification (50–200 words) that answers:
- **What**: What is being built or fixed?
- **Why**: What problem does it solve?
- **Scope**: What is included?
- **Out of scope**: What is explicitly NOT included?
- **Acceptance criteria**: How do we know it's done?

Example:
```
SPEC: Add patchnote entries to Evening Wrap
WHAT: Display a "Patchnote" button in Evening Wrap that opens a modal.
User types a summary of what changed today (e.g., "Fixed vault sorting bug, added dark mode").
Modal has title (auto-filled with today's date), note field, and Save button.
WHY: Testers need a frictionless way to log what changed for release notes.
SCOPE: Evening Wrap modal only. No CHANGELOG updates (done in Step 7).
OUT OF SCOPE: Persisting patchnotes to database, generating release notes.
CRITERIA:
- Button renders in Evening Wrap
- Modal opens/closes cleanly
- Note saves to a temp variable
- No console errors
```

### 2. EXPLORE
Read the relevant source files and document:
- **Existing patterns**: How do modals work? How is state mutated? How are saves handled?
- **Data flow**: Where does the data live? Is it persisted to IndexedDB?
- **Functions to reuse**: Are there existing modal, button, or form utilities?
- **Constraints**: Any hard constraints from CLAUDE.md that apply?

Example findings:
```
FINDINGS:
- Modals use `.modal` class, `showModal()` / `hideModal()` functions
- All state mutations go through saveState() — must await
- XSS: user input must go through escapeHtml()
- Evening Wrap is rendered in eveningWrapScreen()
- No database persistence needed for temp patchnote text
```

### 3. PLAN
Write a detailed implementation plan (bullet points, not prose):
- **Files to modify**: Explicitly list index.html, style.css, app.js sections
- **Functions to add/modify**: Name the functions, describe their input/output
- **Data flow**: How does data move through the app?
- **Edge cases**: What can go wrong? How is it handled?
- **Test steps**: Exact steps to verify (dev, build, preview, browser)

Example:
```
PLAN:
- index.html: Add <button id="patchnoteBtn"> + <div id="patchnoteModal"> after Evening Wrap
- style.css: Add .patchnote-modal styles (same as other modals)
- app.js:
  - Add function openPatchnoteModal() { showModal('patchnoteModal') }
  - Add function savePatchnote() { 
      const text = escapeHtml(document.getElementById('patchnoteInput').value);
      _tempPatchnote = text;
      hideModal('patchnoteModal');
    }
  - Wire button in eveningWrapScreen(): btn.onclick = openPatchnoteModal
- Test:
  1. npm run dev
  2. Navigate to Evening Wrap
  3. Click "Patchnote" button — modal opens
  4. Type text, click Save — modal closes
  5. Refresh page, verify text persists in memory (it should; it's a temp var)
  6. npm run build — must succeed
  7. npm run preview — test in production build
```

### 4. APPROVE
Submit the spec and plan for human review. Do not write code until approved.
- Reviewer checks: scope, patterns, acceptance criteria, edge cases.
- Feedback loop: clarify or adjust before implementation.

### 5. IMPLEMENT
Execute the plan surgically — one change at a time.
- Follow the pattern from CLAUDE.md: "State what will change before applying."
- Make edits in the order listed in the plan.
- After each change, confirm it compiles and runs without errors.
- No refactoring or optimization beyond the spec.

### 6. VERIFY
Run the test steps from the plan:
```bash
npm run dev        # No console errors in browser
npm run build      # Must succeed
npm run preview    # Verify in production build
```
Visually confirm the feature works in the browser. Check all acceptance criteria are met.

### 7. CHANGELOG
Add a new entry to `CHANGELOG.md` under `[Unreleased]`:
```md
## [Unreleased]

### Added
- **Patchnote modal in Evening Wrap**: Users can log what changed in the app during the evening ritual. ([commit-sha](https://github.com/...))
```

### 8. COMMIT
Create one commit for the completed work. Message format:
```
feat: add patchnote modal to Evening Wrap

- Added patchnote button in Evening Wrap
- Modal captures user text and stores in temp variable
- XSS protection via escapeHtml on user input
- Closes with Save or Escape key
```

Types: `feat:` (feature), `fix:` (bug), `perf:` (performance), `ux:` (interaction/style change), `docs:` (documentation), `refactor:` (code cleanup).

### 9. VERSION
When ready to release a batch of changes, bump the version in `package.json`:
```json
{
  "version": "0.2.0"
}
```
Follow semantic versioning: `MAJOR.MINOR.PATCH`
- `MAJOR`: Breaking changes
- `MINOR`: New features (additive, backward-compatible)
- `PATCH`: Bug fixes

Create a commit: `chore: bump version to 0.2.0`

### 10. DEPLOY
Push to the `main` branch. GitHub Actions will automatically deploy to GitHub Pages (`gh-pages` branch).
```bash
git push origin main
```
Verify at: https://the-psyler.github.io/Claude-to-my-life/

---

## Patchnote Conventions

A **patchnote** is a brief, user-facing description of a change. Examples:

| Type | Format | Example |
|------|--------|---------|
| **feat** | "Added X" | "Added patchnote modal to Evening Wrap" |
| **fix** | "Fixed X" | "Fixed vault sorting ignoring date" |
| **ux** | "Improved X" | "Improved dark mode contrast on vault titles" |
| **perf** | "Sped up X" | "Optimized IndexedDB queries for vault load" |

### Changelog Entry Format

```md
### Added
- **Brief title**: Longer description. ([commit](link))

### Fixed
- **Brief title**: Longer description. ([commit](link))

### Changed
- **Brief title**: Longer description. ([commit](link))
```

Every entry should link to the commit on GitHub so reviewers can trace the change.

---

## Example Workflow

```
Day 1: User requests a feature
  → SPEC + EXPLORE + PLAN
  → Submit for approval

Day 2: Human approves plan
  → IMPLEMENT (code changes)
  → VERIFY (test in dev + build + preview)
  → CHANGELOG (add entry)
  → COMMIT (git commit)

Day 3: Release batch ready
  → VERSION (bump package.json)
  → DEPLOY (git push)
  → Live on GitHub Pages
```

---

## Hard Constraints (from CLAUDE.md)

These apply to all features:

**Storage — always async:**
All persistence goes through `saveState()` in app.js. It is async. Every caller must `await` it.
```js
// correct
await saveState();
// wrong — save won't complete
saveState();
```

**XSS — escapeHtml on everything:**
Any user-provided text injected into the DOM must go through `escapeHtml(text)`.
```js
// correct
el.textContent = escapeHtml(userText);
// wrong — XSS vulnerability
el.innerHTML = userText;
```

**CSS — variables only, no hex in JS:**
Colors must use CSS variables.
```js
// correct
element.style.color = 'var(--purple)';
// wrong
element.style.color = '#7C6FF2';
```

**State mutations — one save path:**
All data lives in the `state` object. Mutate state, then call `await saveState()`. Never write to IndexedDB directly outside of saveState/loadState.

---

## Questions?

Refer to:
- `CLAUDE.md` — Hard constraints and rules
- `ARCHITECTURE.md` — Data model, state object, storage schema
- `ROADMAP.md` — Completed phases and upcoming work
