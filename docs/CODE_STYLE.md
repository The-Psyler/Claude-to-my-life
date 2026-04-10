# Code Style

Non-obvious rules only. Standard JS/CSS conventions are assumed.

## JavaScript
- **camelCase** for all variables and functions.
- **No `var`** — use `const`/`let`.
- **async/await** for all Dexie calls. Every `saveState()` call site must be awaited.
- **`escapeHtml(text)`** on all user-provided content before injecting into the DOM. No exceptions.
- **No direct DOM mutation of state** — mutate `state.*`, then call `await saveState()`.
- **No `alert()`** — use `showToast(message, type)` for all user feedback.
- **No hardcoded hex colors in JS** — use `var(--token-name)` via CSS variables.
- **`Date.now()`** for new idea IDs (not `vault.length + 1` — breaks after deletions).
- **ISO dates (`YYYY-MM-DD`)** for `focus.date`, `lastBootDate`, `workLog[].date`, `reflections[].date`.
- **Human-readable dates (`'Apr 10'`)** for `idea.date` (display/capture date only).

## CSS
- All colors, radii, and spacing tokens must be defined in `:root` in `style.css`.
- No inline `style=""` for colors — use classes.
- New UI components get their own named block in `style.css` with a comment header.

## HTML
- No logic in HTML. Handlers like `onclick="fn()"` are fine; complex logic belongs in app.js.
- All interactive elements that aren't `<button>` or `<a>` need `role` and `tabindex`.
- Dynamic content containers start empty — populated by `render*()` functions on init.
