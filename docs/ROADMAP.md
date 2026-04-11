# Project Roadmap

## Phase 1: Foundation (Completed — Apr 9)
- [x] Single-file prototype (index.html)
- [x] Basic navigation and screen switching
- [x] localStorage integration for Karma and Vault
- [x] XSS protection and basic accessibility (ARIA)

## Phase 1.5: Immediate Fixes (Completed — Apr 10)
- [x] Edit / Delete on vault items (inline modal)
- [x] Toast notifications replacing all alert() calls
- [x] JSON export + import for data portability
- [x] localStorage validation on load (corrupt-safe)
- [x] Fixed goBack() bug on Evening screen

## Phase 2: Structural Cleanup (Completed — Apr 10)
- [x] Split into three files: index.html, style.css, app.js
- [x] Unified `state` object — single saveState() / loadState()
- [x] Migration from old separate storage keys (ctml_vault, ctml_karma, ctml_locked)
- [x] Removed all hardcoded hex colors from JS; CSS variables used throughout
- [x] Work screen renders dynamically from state.vault (no more hardcoded cards)
- [x] Morning Boot ↔ Work screen focus link: setFocus() wires the daily loop
- [x] Morning Boot stats (ideas / active / waiting) computed from live vault data
- [x] Playbook entries are now persistent, addable from UI, rendered dynamically
- [x] Evening Wrap "what moved today" shows live focus + today's captures
- [x] Unlock Day button always in DOM (show/hide) — no more dynamic DOM creation
- [x] Escape key closes edit modal; Ctrl+S scoped to capture screen only

## Phase 3: Advanced Features (In Progress)
- [x] ~~Streak counter~~ — explicitly excluded by user preference
- [x] **The Continuity Bridge**: Resurrect yesterday's unfinished focus during Morning Boot.
- [ ] **The Atomic Ceremony**: Implement a session-anchored `sessionDate` to prevent midnight boundary errors.
- [x] **The Persistence Sentinel**: Serialize saveState() writes + visibilitychange forced-save.
- [ ] **The Sync Broadcast**: Use `BroadcastChannel` to synchronize all open tabs in real-current state.
- [x] **State / next-action editing from Work screen**: Update nextAction inline, not just via Vault modal
- [x] **Morning Boot auto-unlock**: Entering Morning Boot while day is locked unlocks immediately. (Date-aware version deferred to Atomic Ceremony.)
- [x] **Vault work log display**: Vault Log column now shows dated work log notes; Last note column shows most recent entry.
- [x] **Capture simplification**: Category and Potential removed from Capture screen — title + optional note only.
- [x] **Vault "Last note" column**: Renamed from "Next action"; shows last work log note, falls back to capture note.

## Phase 4: Deployment & Scaling (Planned)
- [ ] **Service Worker / PWA**: Offline capability and "Add to Home Screen"
- [ ] **Build pipeline**: Vite for minification and cache-busting
- [ ] **Claude API integration**: Suggest next actions or surface dormant ideas
- [ ] **Light theme toggle**: Respect prefers-color-scheme or manual toggle
