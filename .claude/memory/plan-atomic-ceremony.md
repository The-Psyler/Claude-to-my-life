---
name: plan-atomic-ceremony
description: Implementation plan for establishing a single source of truth for the date (sessionDate) to prevent midnight boundary errors.
type: project
---

Establish `state.sessionDate` to replace direct `new Date()` calls in all date-sensitive logic.

**Why:** Prevents race conditions where the application's perception of "today" shifts mid-session due to browser tab staying open across midnight.

**How to apply:** 
1. Update `state` object definition in `src/app.js`.
2. Initialize `sessionDate` during `loadState()` (defaulting to current ISO date).
3. Refactor all functions referencing `new Date()` or `todayISO()` to use `state.sessionDate`.
4. Ensure `startDay()` updates `sessionDate` when a new day begins.
