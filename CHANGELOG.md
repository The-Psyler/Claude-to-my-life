# Changelog

All notable changes to Claude to My Life (CTML) are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Pending (Phase 4 — Closed Alpha Distribution)
- PWA icons generation (192px, 512px)
- Full QA pass on mobile (Android PWA, iPhone Safari)
- Service Worker update flow verification

## [0.1.2] — 2026-04-13

### Changed
- **Sparks system rework**: Renamed "branches" → "sparks" throughout. Sparks are now expandable sub-ideas within an idea, each with their own progress log.
- **Per-spark progress notes**: When working on a spark, log progress notes under that specific spark instead of the main idea's flat log. Main work log remains for general notes.
- **Spark toggle & expansion**: Click a spark row to expand and reveal its notes + textarea. Arrow indicator shows expand state (› / ⌄). Checkbox toggles done state.
- **Removed kind-toggle UI**: The Progress/Spark buttons on the main work log are gone — that was a misinterpretation of the feature. All notes logged to main work log are now simple progress entries.
- **Vault detail view**: Sparks shown with their notes nested underneath, making it easy to see all work tied to each spark.
- **Data migration**: Old "branches" field automatically migrates to "sparks" on load with empty notes arrays.

## [0.1.1] — 2026-04-13

### Fixed
- **Language selection persistence**: Language now saved to localStorage synchronously (mirrors theme pattern). Applied from localStorage before IndexedDB load to prevent flash of English on PWA restart. ([53f34e4](https://github.com/The-Psyler/Claude-to-my-life/commit/53f34e4))
- **BroadcastChannel translation sync**: applyTranslations() now called when other tabs reload state, ensuring multi-tab consistency. ([53f34e4](https://github.com/The-Psyler/Claude-to-my-life/commit/53f34e4))

### Added
- **Home screen focus pill**: Today's morning focus task now displayed prominently on home screen when set. Shows title and next action. ([53f34e4](https://github.com/The-Psyler/Claude-to-my-life/commit/53f34e4))

### Changed
- **Nav bar icons**: Replaced colored dots with SVG icons — house (Home), database (Vault), sliders (Settings). Same color scheme maintained. ([53f34e4](https://github.com/The-Psyler/Claude-to-my-life/commit/53f34e4))
- **Day state visual feedback**: Background color shifts to darker greenish tint when day is locked, signaling "rest mode". ([53f34e4](https://github.com/The-Psyler/Claude-to-my-life/commit/53f34e4))

## [0.1.0-alpha] — 2026-04-12

### Phase 1: Foundation (Apr 9)
- Single-file prototype (index.html)
- Basic navigation and screen switching
- localStorage integration for Karma and Vault
- XSS protection and basic accessibility (ARIA)

### Phase 1.5: Immediate Fixes (Apr 10)
- Edit / Delete on vault items (inline modal)
- Toast notifications replacing all alert() calls
- JSON export + import for data portability
- localStorage validation on load (corrupt-safe)
- Fixed goBack() bug on Evening screen

### Phase 2: Structural Cleanup (Apr 10)
- Split into three files: index.html, style.css, app.js
- Unified `state` object with single saveState() / loadState()
- Migration from separate storage keys to IndexedDB
- Removed hardcoded hex colors from JS; CSS variables only
- Work screen renders dynamically from state.vault
- Morning Boot ↔ Work screen focus link via setFocus()
- Morning Boot stats computed from live vault data
- Persistent, dynamic Playbook entries
- Evening Wrap "what moved today" shows live focus + captures
- Unlock Day button always in DOM (show/hide)
- Escape key closes edit modal; Ctrl+S scoped to Capture screen

### Phase 3: Advanced Features (Apr 11)
- The Continuity Bridge: resurrect yesterday's unfinished focus
- The Atomic Ceremony: session-anchored `sessionDate` prevents midnight errors
- The Persistence Sentinel: serialized saveState() + visibilitychange forced-save
- The Sync Broadcast: BroadcastChannel synchronizes all open tabs
- State / next-action editing from Work screen (inline)
- Morning Boot auto-unlock when day is locked
- Vault work log display with dated entries
- Vault "Last note" column shows most recent entry
- Capture screen simplified: title + optional note only

### Phase 3.5: Vault UX Polish (Apr 11)
- Vault idea detail view: click any row to see full work log history
- Removed JSON import/export (data lives in IndexedDB)

### Phase 4: Closed Alpha Distribution (Apr 12)
- Service Worker / PWA support
- Offline capability and "Add to Home Screen"
- Light theme toggle respecting prefers-color-scheme or manual toggle
- Bilingual welcome screen (HU/EN) with install instructions
- "How to install" button in Settings
- Fixed back button overlapping title text
- Repository made public, GitHub Pages enabled and deploying
- Live at: https://the-psyler.github.io/Claude-to-my-life/

---

## Post-Alpha (Phase 5 — Deferred)
- Voice capture via SpeechRecognition API
- Weekly review screen (trends, stalled ideas)
- Claude API integration (suggest next actions, surface dormant ideas)
