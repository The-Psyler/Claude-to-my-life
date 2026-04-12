# Testing Strategy

## Overview

**CTML** is a vanilla JS app with no test framework. Testing is **manual** + **browser DevTools inspection**.

Why? The app is small (single file, ~1000 LOC), UI-heavy, and state is visual. Integration tests > unit tests here.

## Manual Testing (Primary)

### Morning Boot Flow
```
1. Open app, click "Morning Boot"
2. See vault list (or empty state)
3. Select an idea or enter free text
4. Submit
→ Verify: state.focus updated, UI shows focus at top, localStorage updated
```

### Capture Flow
```
1. From home, click "Capture"
2. Enter title + optional category, potential, note
3. Click "Capture"
→ Verify: idea appears in vault, karma +3 or +8, IndexedDB has new entry
```

### Work on It
```
1. From home, click "Work on It"
2. See current focus (or vault picker if no focus)
3. Click vault idea → enter note → "Log work"
→ Verify: note appends to idea.workLog, "Last note" updates in vault table
```

### Evening Wrap
```
1. Click "Evening Wrap"
2. Write reflection
3. Choose: attach to focus or standalone
4. Submit
→ Verify: reflection saved, dayLocked set, karma +18, next morning prompts "new day"
```

### Cross-Tab Sync
```
1. Open app in Tab A and Tab B
2. In Tab A: change focus to different idea
3. In Tab B: see focus update instantly
→ Verify: BroadcastChannel message received, no manual refresh needed
```

### Light/Dark Theme
```
1. Click sun/moon icon in nav
2. Page toggles dark ↔ light
3. Refresh page
→ Verify: preference persists in localStorage, theme applies on load
```

### Offline Mode
```
1. F12 → Network → Offline
2. Refresh page
3. Interact: boot, capture, work, wrap
4. Go back online, refresh
→ Verify: all offline changes still in IndexedDB
```

## Browser DevTools Inspection

### IndexedDB Verification
```
F12 → Application (Chrome) or Storage (Firefox)
→ IndexedDB → ctml → ideas (table)
→ See all vault items with id, title, state, workLog, date
→ Verify latest action appears here within 100ms
```

### XSS Prevention Test
```
1. Go to Capture
2. Title field: type <img src=x onerror="alert('XSS')">
3. Submit
4. Go to Vault
5. Click into idea
→ Verify: no alert fires; text displays escaped as literal HTML
→ If alert fires → XSS vulnerability → revert
```

### Mutation Integrity
```
1. Open DevTools Console
2. Run: const before = JSON.stringify(state);
3. Change focus, capture idea, log work
4. Run: JSON.stringify(state) !== before → true
→ Verify: state object references changed (not mutated in-place)
```

### Performance
```
1. F12 → Performance tab
2. Record a full Boot → Capture → Work → Wrap cycle
3. Look for:
   - No janky scrolls (>60fps target)
   - saveState() completes within 50ms
   - DOM updates < 100ms after state change
```

## Regression Checklist

After any code change, verify:
- [ ] No console errors or warnings
- [ ] Capture → Vault → Work → Wrap flow unbroken
- [ ] Focus state persists across refresh
- [ ] XSS escaping still works (paste HTML, verify escaped)
- [ ] Cross-tab sync still active
- [ ] IndexedDB has all expected tables with correct schema
- [ ] Light/dark theme preference persists
- [ ] Offline mode still functional

## Automated Testing (Phase 5)

Future: Playwright E2E tests for critical flows. Currently manual due to vanilla JS + small scope.

Test candidates when automated:
- Morning Boot → evening Wrap cycle
- Vault CRUD operations
- XSS payload escaping
- IndexedDB persistence under quota pressure
