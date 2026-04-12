# Build & Run

## Development

### Quick Start
1. Open `src/index.html` directly in your browser (Chrome, Firefox, Safari, Edge)
2. No build tool, no npm, no server required
3. All code changes are live on save (just refresh browser)

### Testing in Browser

**Console errors:**
- Press `F12` → Console tab
- Look for red error messages
- State mutations or async issues show here immediately

**Offline mode:**
- Press `F12` → Network tab
- Click "Offline" checkbox
- Refresh page
- App should work fully offline (all data from IndexedDB)

**IndexedDB inspection:**
- Press `F12` → Application tab (Chrome) or Storage (Firefox)
- Navigate to IndexedDB → ctml
- View `ideas`, `playbook`, `settings` tables
- Verify state matches UI display

**Cross-tab sync:**
- Open `src/index.html` in two separate tabs
- Change focus in tab A
- Tab B should update instantly (via BroadcastChannel)
- If not syncing, check console for errors

## PWA Setup

### Icons Required
The app has PWA support, but needs icons for install prompt:
- `src/icons/icon-192.png` (192×192 px, square)
- `src/icons/icon-512.png` (512×512 px, square)

Generate from [favicon.io](https://favicon.io) or similar.

### Installation
- Once icons are added, open app in Chrome/Edge
- Address bar → "Install CTML" prompt appears
- Click to install as standalone app
- Works offline, appears in app drawer

### Service Worker
- Registered in `index.html`
- Located at `src/sw.js`
- Caches app shell on first load
- No update strategy yet (TODO in Phase 4)

## Production Deployment

### Static Host (Recommended)
Deploy `src/` folder to any static host:
- Netlify, Vercel, GitHub Pages, AWS S3
- No server needed
- HTTPS required for PWA features

### Build Pipeline (Phase 4)
- Use Vite for minification + cache-busting
- Output single `index.html` + `bundle.js` + `bundle.css`
- Current state: vanilla files, no minification yet

## Debugging

### State not persisting
1. Open DevTools → Application → IndexedDB → ctml
2. Check if `ideas`, `playbook`, `settings` tables exist
3. Add breakpoint in `app.js` at `saveState()` function
4. Verify `await` keyword is used (missing await = silent fail)

### UI not updating after state change
1. Check that `renderUI()` is called after `saveState()`
2. Verify DOM elements exist (check HTML structure)
3. Look for XSS escaping issues (see CLAUDE.md)

### localStorage/IndexedDB conflict
Old localStorage keys are auto-migrated on first load via `migrateOldStorage()`.
If stuck, clear both:
```js
// In browser console
localStorage.clear()
// Then go to DevTools → Application → Storage → Clear site data
```

## Testing Checklist

Before pushing commits:
- [ ] App opens without console errors
- [ ] Works in offline mode (F12 → Network → Offline)
- [ ] State persists after refresh
- [ ] Cross-tab sync works (open 2 tabs, change focus in one)
- [ ] Light/dark theme toggle persists
- [ ] Vault detail screen opens and closes correctly
- [ ] No XSS vulnerabilities (paste HTML in vault title, verify it escapes)
