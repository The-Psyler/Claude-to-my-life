# HANDOFF — 2026-04-18 (v0.3.6 i18n Polish & iOS icon)

## Status
Phase 4 (Closed Alpha) — v0.3.6 deployed. All Settings labels, delete modal, and toasts now use i18n. iOS apple-touch-icon added. Ko-fi donation section wired. Morning Boot unlock now fully date-aware.

## Completed this session (v0.3.6)
- **Morning Boot unlock fix**: `navigateTo('morning')` now checks date before auto-unlock
- **Complete i18n coverage**: Settings (Install, Install how-to, Sync, Support, Donate, Donate hint), delete modal title/warning, toasts (come back tomorrow, refreshing)
- **iOS apple-touch-icon**: Added link for iPhone PWA install
- **Ko-fi donation section**: Wired in Settings (placeholder link — user to update with real Ko-fi username)
- **Version bump** to 0.3.6 in package.json and index.html

## Working features
✓ Vault table: title column always fixed & visible (no horizontal scroll-off)
✓ Work screen sparks: create + add notes only (no toggle)
✓ Vault detail screen: spark done toggle + idea state toggle
✓ State badges: Active (teal), New (purple), Future (amber), On Hold (muted), Done (green)

## Released (v0.1.2 — 2026-04-13)
✓ Sparks system: expandable sub-ideas with own progress logs
✓ Per-spark note logging (logSparkNote)
✓ Spark toggle expand/collapse (toggleSparkExpand)
✓ Spark done checkbox (toggleSpark)
✓ Vault detail view shows sparks + their notes
✓ Backward migration: branches → sparks + notes: []

## Pending (Phase 4 — QA & Polish)
- PWA icons (192px, 512px)
- Full QA pass on mobile (Android PWA, iPhone Safari)
- Service Worker update flow verification

## Phase 5+ (deferred, post-alpha)
- Spark → Vault promotion (new button)
- Spark delete/reorder
- Evening wrap integration with sparks
- Other ideas: graphing, milestone decomposition, contextual prompting

## Live URL
https://the-psyler.github.io/Claude-to-my-life/
