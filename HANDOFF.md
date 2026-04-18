# HANDOFF — 2026-04-18 (v0.3.8 User Feedback Form)

## Status
Phase 4 (Closed Alpha) — v0.3.8 deployed. User feedback modal added with Formspree integration + mailto fallback. EN/HU translations complete.

## Completed this session (v0.3.8)
- **Feedback modal**: HTML structure mirrors reset-modal pattern (`.active` class toggle)
- **Settings section**: New "Feedback" button between Support and Data sections
- **JS handlers**: openFeedbackModal(), closeFeedbackModal(), submitFeedback() with Formspree POST
- **Fallback**: If Formspree fails, mailto opens with pre-filled subject & body
- **Translations**: EN/HU keys for modal, toast messages (feedback_sent, feedback_fallback)
- **Version bump** to 0.3.8 in package.json and index.html

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
