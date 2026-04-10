# Architecture

## File structure
Three source files, each with one responsibility:
- `index.html` — structure only. No inline styles, no inline scripts.
- `style.css` — all visual rules. CSS variables in `:root` are the single source for all colors/radii.
- `app.js` — all logic, state, persistence, render functions.
- `dexie.min.js` — local copy of Dexie 3.2.7 (IndexedDB wrapper).

## Storage: Dexie / IndexedDB
Data is persisted in IndexedDB via Dexie, **not** localStorage. Three tables:

| Table | Key | Purpose |
|---|---|---|
| `ideas` | `id` (Date.now()) | Vault items including work logs |
| `playbook` | `++id` (auto) | Playbook entries |
| `settings` | `key` (string) | All scalars: karma, focus, dayLocked, lastBootDate, reflections |

On first load, `migrateOldStorage()` checks for legacy localStorage keys and imports them into Dexie automatically.

**Cross-platform path:** Dexie is the abstraction layer. When the app is packaged with Capacitor (iOS/Android) or Electron (Windows desktop), only the Dexie init block in app.js needs to swap for the native SQLite adapter. The rest of the codebase is unchanged.

## State object (in-memory, mirrors Dexie)
```js
state = {
    karma:        number,
    vault:        Idea[],
    playbook:     PlaybookEntry[],
    reflections:  Reflection[],
    focus: {
        ideaId:        number | null,
        title:         string,
        nextAction:    string,
        isVaultLinked: boolean,   // was this picked from vault?
        date:          string     // ISO YYYY-MM-DD
    },
    dayLocked:    boolean,
    lastBootDate: string | null   // ISO YYYY-MM-DD — drives date-tied unlock
}

Idea = { id, title, category, state, potential, nextAction, date, workLog: WorkLogEntry[] }
WorkLogEntry = { date: ISO string, note: string }
Reflection = { date: ISO string, text: string, focusId: number | null }
```

## Daily loop data flow
```
Morning Boot  → state.focus set (vault-linked or free text) + lastBootDate
     ↓
Work on It    → idea.workLog entries appended + setFocus() updates state.focus
     ↓
Evening Wrap  → state.reflections entry added + optional workLog attachment
     ↓
Day locked    → state.dayLocked = true
     ↓
Next morning  → startDay() detects new date → auto-clears dayLocked
```

## Module-level temp vars (not persisted)
```js
_pendingMorningIdeaId  // vault picker selection before startDay() commits
_attachDecision        // null | true | false — evening reflection attach choice
```

## Karma awards
| Action | Points |
|---|---|
| Start day | +5 |
| Full capture (with note/category) | +8 |
| Quick capture (name only) | +3 |
| Close day | +18 |
