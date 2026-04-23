# Hardening Report — v0.4.0

**Branch:** `hardening-v0.4.0` (forked from `main` at commit `6369655`)
**Date:** 2026-04-23
**Scope:** Bug audit + surgical fixes from the plan in `~/.claude/plans/i-want-you-to-robust-lecun.md`. Build verified green.

---

## What was done

### CRITICAL — missing `await saveState()`
All three direct violations of the project's own storage rule are fixed.

| ID | File:line (before) | Fix |
|---|---|---|
| C1 | `static/app.js:36` `setLanguage` | Made async, added `await saveState()`. Language change is now persisted before the function returns. |
| C2 | `static/app.js:243` `navigateTo('morning')` auto-unlock | Made `navigateTo` async, added `await saveState()` so the unlocked state is written before any subsequent UI render or reload. |
| C3 | `static/app.js:1472` `visibilitychange` | Listener made async, `await saveState()`. The persistence-sentinel write that fires when the tab is hidden (browser-switch / Alt-Tab / close) now actually completes. |

### HIGH

| ID | Fix |
|---|---|
| H1 | Added `pagehide` listener that closes the `BroadcastChannel`, preventing orphaned listeners across reloads. |
| H5 | `navigateTo('morning')` auto-unlock now treats `lastBootDate === null` (fresh install with `dayLocked` imported) as "needs unlock" instead of leaving the user permanently locked. |

### MEDIUM

| ID | Fix |
|---|---|
| M3 | `toggleIdeaDone()` now syncs `state.focus.title` and re-renders the home focus card when the toggled idea is the current focus, eliminating a stale-UI race. |
| Cache bust | Bumped service-worker cache from `ctml-v4` → `ctml-v5` so users get the new bundle without a hard reload. |

### Version bump
`package.json`, `static/app.js` (×2 — diagnostic + about), `src/index.html` settings panel, and `static/sw.js` cache key all advanced to **0.4.0**.

### Carried over from previous session (unstaged, kept on this branch)
The previous session had improved `static/sw.js` (network-first for HTML/JS/CSS, stale-while-revalidate for static assets, `SKIP_WAITING` message handling). These changes are preserved and now tagged as `ctml-v5`.

---

## Audit items intentionally NOT changed

These were flagged by the agent but **verified in source as already-correct or out of scope per user instruction**:

| Flagged | Verdict |
|---|---|
| L1 viewport `user-scalable=no` | **Skipped per user request** — zoom is not an intended feature. |
| H2 BroadcastChannel onmessage stale read | **Already correct** — `app.js:1458-1464` already calls `await loadState(); renderCurrentScreen();` before re-rendering. |
| H4 swallowed Dexie errors | **Already surfaced** — `saveState()` and `loadState()` already call `showToast(t('toast_save_failed' / 'toast_load_failed'), 'error')`. The queue staying alive on failure is by design. |
| Agent's claimed XSS at `app.js:607` `renderEveningMoved` | **False positive** — line 626 escapes via `escapeHtml(item)` in the template before `innerHTML` assignment. |
| M1 date-format mismatch in `renderEveningMoved` | **False positive** — `idea.date` is stored as the locale string (lines 751, 777) and is filtered with `today` (also locale); `workLog.date` is ISO and is filtered with `todayISO_`. Both filters match their respective source formats. |
| M4 `manifest.json` `start_url: "./"` vs Vite `base` | **Correct as-is** — `./` resolves relative to the manifest URL, which under `base: '/Claude-to-my-life/'` resolves correctly on GitHub Pages. |

---

## Verification

- `npm run build` → clean, 113 ms, no warnings beyond Vite's expected "can't be bundled without `type="module"`" notes for the verbatim-copied `app.js`/`dexie.min.js`/`translations.js`. These are intentional per `CLAUDE.md`.
- All edits are surgical (no function bodies rewritten, no architectural changes).
- Branch `hardening-v0.4.0` is independent of `main` — `main` is untouched.

### Manual test plan (recommended before merge)

Run through on a real browser, ideally a freshly-installed PWA:

1. **Language switch** — change EN ↔ HU; reload page; setting must persist.
2. **Day-lock + Refresh button** — close day; verify Refresh button is disabled and styled at 0.4 opacity; verify button is re-enabled after unlock.
3. **Auto-unlock** — close day; close browser; change system date forward by one day; reopen and tap "Morning" tab; day should auto-unlock and the unlock must persist after a reload (this is the C2/H5 fix).
4. **Visibility hide save** — capture a new idea; immediately Alt-Tab away; close the tab without returning; reopen; the new idea must be present (this is the C3 fix).
5. **Cross-tab sync** — open two tabs; capture in one; second tab should reflect the new idea within ~1 s (sanity check that BroadcastChannel still works post-pagehide-listener change).
6. **Toggle idea done** — open vault detail of the currently-focused idea; toggle done; verify the home screen focus card updates (this is the M3 fix).

---

## Further steps still open

These are deliberately deferred — they are improvements/restructuring rather than bug fixes, and the user asked for issue fixes. They are the natural next phase before native packaging.

### Improvement backlog (priority order)

1. **Playwright E2E smoke test** for the daily ritual loop. Without this, every WebView quirk in Capacitor/Tauri becomes a manual hunt. Add `tests/smoke.spec.ts` covering: boot → capture → work log → evening close → reload → next-day unlock.
2. **Build-hash in service worker.** Replace the manual `'ctml-v5'` bump with a Vite-injected hash (Vite plugin or simple `define` substitution). Eliminates "users still on old cache" support burden.
3. **Re-introduce JSON Backup screen.** Removed in Phase 3.5; necessary again before shipping inside sandboxed Android/desktop containers where users have no easy file-system access to the IndexedDB store.
4. **Extract Dexie init into `static/storage.js`.** Required for clean swap to `@capacitor/sqlite` or `tauri-plugin-sql` if IndexedDB eviction becomes a problem on Android.
5. **Dexie schema versioning ladder** (`db.version(N).stores(...)`) so future shape changes don't require a manual reset.
6. **Lint + format toolchain.** Add `prettier` and `eslint` (config-only — no full migration). At minimum a `package.json` `lint` script.

### Native packaging (per the original plan)

Three platforms, all use the same `dist/` build. Estimated 10-12 hours total once the backlog above is done.

| Platform | Tool | Status |
|---|---|---|
| **Android APK** | Capacitor + Android Studio (signing keystore, sideload) | Not started |
| **Windows desktop** | Tauri v2 + WebView2 (~10 MB MSI, optional code-signing) | Not started |
| **macOS desktop** | Tauri v2 + WebKit (~25 MB DMG, Apple Developer cert for notarization) | Not started |

Storage adapter swap is **not required for v1** — Dexie/IndexedDB works in both Capacitor's WebView and Tauri. Only swap if Android starts evicting the IndexedDB store under memory pressure.

Optional Phase E: a single GitHub Actions workflow that on tag push builds all three artifacts and attaches them to a GitHub release. Future updates become `git tag vX.Y.Z && git push --tags`.

Full per-platform commands and signing notes are in `~/.claude/plans/i-want-you-to-robust-lecun.md` Phases B, C, D.

---

## Files modified on this branch

- `package.json` — version bump
- `static/app.js` — C1, C2, C3, H1, H5, M3, version refs
- `static/sw.js` — cache name bump (carries forward last session's network-first SW improvements)
- `src/index.html` — version display
- `HARDENING_REPORT.md` — this file
