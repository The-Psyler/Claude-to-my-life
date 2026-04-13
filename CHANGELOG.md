# Changelog

All notable changes to Claude to My Life (CTML) are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Pending (Phase 4 — Closed Alpha Distribution)
- PWA icons generation (192px, 512px)
- Vite build pipeline optimization
- GitHub Pages deployment automation
- Service Worker update notifications
- Full QA pass on mobile (Android PWA, iPhone Safari)
- Service Worker update flow verification

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
