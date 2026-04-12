# CTML — Claude to My Life

Personal productivity app built around four daily rituals: Morning Boot → Capture → Work on It → Evening Wrap. Single-user, offline-first, personal tool.

## Run

**Development:** `npm run dev` — starts Vite dev server with hot reload.
**Production:** `npm run build` — outputs optimized files to `dist/`.
**Legacy:** Opening `src/index.html` directly still works for quick checks.

## Source files
```
src/index.html       — HTML structure (Vite processes this as entry point)
src/style.css        — All styles, CSS variables only (Vite hashes for cache-busting)
static/app.js        — All logic (copied verbatim to dist/)
static/dexie.min.js  — IndexedDB wrapper (copied verbatim to dist/)
static/sw.js         — Service worker (stale-while-revalidate caching)
static/manifest.json — PWA manifest
static/icons/        — PWA install icons (192px, 512px)
```

**Why src/ vs static/:** Vite processes files in `src/` (HTML entry, CSS hashing). Files in `static/` are copied as-is to `dist/` — used for non-module JS that Vite can't bundle.

## Deployment
- **Target:** GitHub Pages serving `dist/` on the `gh-pages` branch
- **URL:** https://the-psyler.github.io/Claude-to-my-life/
- **Install:** PWA-installable on PC (Chrome/Edge), Android (Chrome), iPhone (Safari)

## Hard constraints
- **No frameworks.** Vanilla JS only. No React, Vue, jQuery, etc.
- **No CDN at runtime.** All dependencies are local files in static/.
- **Build must be simple.** Vite for minification + cache-busting only. No transpilation, no bundler plugins, no complex config.

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

## Verification
After any HTML/CSS/JS change:
1. Check `npm run dev` — no console errors in browser.
2. Run `npm run build` — must succeed without errors.
3. Test `npm run preview` — verify production build works.
4. Visually confirm the change in browser before moving on.
