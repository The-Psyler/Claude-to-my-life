# Proposal: The Atomic Ceremony (Implementation)

This proposal outlines the steps to implement `sessionDate` in `src/app.js` to provide a stable date for the entire app session, preventing midnight boundary errors.

## 1. Update State Definition
Add `sessionDate` to the `state` object in `src/app.js`.

```javascript
// src/app.js (around line 60)
    lastBootDate:    null,        // ISO YYYY-MM-DD
    karmaAtDayStart: 0,           // karma snapshot at day start
    sessionDate:      null        // ISO YYYY-MM-DD (stable for the session)
};
```

## 2. Update Persistence (Save/Load)
Ensure `sessionDate` is persisted via Dexie so it survives refreshes but remains constant within a single session lifecycle.

**In `saveState()`:**
Add `{ key: 'sessionDate', value: state.sessionDate }` to the `bulkPut` array.

**In `loadState()`:**
Add logic to read and assign `state.sessionDate` from settings.

```javascript
// src/app.js (around line 120)
if (settings.lastBootDate !== undefined) {
    state.lastBootDate = settings.lastBootDate;
}
if (settings.sessionDate !== undefined) {
    state.sessionDate = settings.sessionDate;
}
```

## 3. Initialize `sessionDate` on Load
In `loadState()`, if `state.sessionDate` is not present (first load or after a period of inactivity), initialize it with the current date.

```javascript
// src/app.js (inside loadState, after loading settings)
if (!state.sessionDate) {
    state.sessionDate = todayISO(); 
}
```

## 4. Refactor Date-Sensitive Logic
Replace all occurrences of `new Date()` or direct `todayISO()` calls with references to `state.sessionDate` where the date must be stable for the session (e.g., determining if a day is "locked", calculating daily karma, rendering the work log).

**Key targets for refactoring:**
- `startDay()`: Should use `state.sessionDate`.
- `todayISO()`: Update to return `state.sessionDate` if available.
- UI elements displaying today's date (e.g., "April 11, 2026").

## 5. Verification Plan
1. **Refresh Test:** Open `index.html`, check the console/UI for the current date. Refresh the page. Verify `sessionDate` persists and remains the same.
2. **Midnight Boundary Simulation (Manual):** Manually set a `sessionDate` in the DevTools to "yesterday" and verify that the app still treats it as the "active" session date until a new `startDay()` is triggered.
