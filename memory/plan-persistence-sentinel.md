---
name: plan-persistence-sentinel
description: Implementation plan for improving data integrity and preventing loss during interrupted writes or tab closures.
type: project
---

Implement `visibilitychange` listeners and robust transaction patterns for Dexie operations.

**Why:** Reduces risk of partial state updates and data loss from unexpected browser shutdowns or tab kills.

**How to apply:** 
1. Add a global listener for the `visibilitychange` event in `src/app.js`.
2. On `visibilitychange`, trigger an aggressive `await saveState()`.
3. Audit Dexie transactions (especially `importVault`) to ensure atomicity via proper transaction usage.
