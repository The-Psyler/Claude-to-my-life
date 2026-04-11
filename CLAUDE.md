# CTML — Claude to My Life

Personal productivity app built around four daily rituals: Morning Boot → Capture → Work on It → Evening Wrap. Single-user, offline-first, personal tool.

## Run
Open `src/index.html` in any modern browser. No build step, no npm, no server.

## Source files
```
src/index.html   — HTML structure only (no logic, no styles)
src/style.css    — All styles, CSS variables only
src/app.js       — All logic
src/dexie.min.js — IndexedDB wrapper (local file, not CDN)
```

## Hard constraints
- **No frameworks.** Vanilla JS only. No React, Vue, jQuery, etc.
- **No build step.** Everything must work by opening index.html directly.
- **No CDN.** All dependencies are local files in src/.

## Critical rules

**Storage — always async**
All persistence goes through `saveState()` in app.js, which writes to IndexedDB via Dexie. It is async. Every caller must `await` it. Missing an `await` silently skips the save.
```js
// correct
await saveState();
// wrong — save won't complete before next operation
saveState();
```

**XSS — escapeHtml on everything**
Any user-provided text injected into the DOM must go through `escapeHtml(text)`. This includes vault titles, notes, work log entries, and playbook text. No exceptions.

**CSS — variables only, no hex in JS**
Colors in JS must use `var(--purple)` etc., never `#7C6FF2`. All color tokens are in `:root` in style.css.

**State mutations — one save path**
All data lives in the `state` object in app.js. Mutate state, then call `await saveState()`. Never write to IndexedDB or localStorage directly outside of saveState/loadState.

## Architecture & data model
See @docs/ARCHITECTURE.md

## Roadmap & phases
See @docs/ROADMAP.md

## Working Rules

**Language:** Always respond in English.

**File access:** Read files by explicit path only. Never delegate simple file reads to sub-agents.

**Change discipline:**
- Make one change at a time. Before applying, state what will change and which elements are affected.
- Never rewrite a full file. Make surgical, targeted edits only.
- If a change touches more than ~20 lines, present a plan and wait for approval.

**UI/Styling changes:**
- Before any HTML/CSS/layout change: state the plan, list affected elements, wait for go-ahead.
- If a change breaks the UI, revert immediately — do not attempt to fix forward.

**After each confirmed working change:** Remind user to commit before moving to the next task.

**When uncertain:** Say so immediately. Do not substitute similar-sounding alternatives.
