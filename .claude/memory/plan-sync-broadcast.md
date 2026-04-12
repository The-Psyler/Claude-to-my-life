---
name: plan-sync-broadcast
description: Implementation plan for synchronizing state across multiple browser tabs using BroadcastChannel API.
type: project
---

Implement `BroadcastChannel` to synchronize the application's in-memory `state` and UI across all open CTML tabs.

**Why:** Prevents stale data (Karma, Day Locked status) when a user interacts with the app through multiple windows or monitors.

**How to apply:** 
1. Initialize a `BroadcastChannel('ctml_sync')` in `src/app.js`.
2. In `saveState()`, call `channel.postMessage('state-updated')` after successful persistence.
3. Add an event listener for `'message'` on the channel during initialization to trigger `load/render` upon receiving updates from other tabs.
