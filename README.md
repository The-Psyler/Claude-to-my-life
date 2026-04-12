# Claude to My Life (CTML)

A personal productivity app built around four daily rituals: **Morning Boot → Capture → Work on It → Evening Wrap**.

Single-user, offline-first, no build step. Open `src/index.html` in any modern browser.

## Quick Start

1. Open `src/index.html` in Chrome, Firefox, or Safari
2. Go through Morning Boot to set your day's focus
3. Capture ideas throughout the day
4. Log progress toward each idea
5. Wrap your day with reflections

## Key Concepts

- **Vault** — Repository of all captured ideas with state (Backlog, Active, Completed)
- **Focus** — Your chosen idea or task for the day
- **Work Log** — Chronological notes attached to each idea
- **Playbook** — Reusable templates for recurring tasks
- **Karma** — Points earned for completing rituals (gamification)

## Documentation

- **[Architecture](docs/ARCHITECTURE.md)** — Data model, state flow, storage
- **[Build & Run](docs/BUILD.md)** — Development setup and PWA deployment
- **[Code Style](docs/CODE_STYLE.md)** — Conventions and constraints
- **[Roadmap](docs/ROADMAP.md)** — Current phases and planned features
- **[Testing](docs/TEST.md)** — Manual testing strategy

## Tech Stack

- **No frameworks** — Vanilla JavaScript only
- **No build step** — Works by opening HTML directly
- **No CDN** — All dependencies bundled locally
- **Storage** — IndexedDB via Dexie (with localStorage fallback import)
- **PWA** — Offline-capable with service worker

## Critical Rules

See [CLAUDE.md](CLAUDE.md) for project constraints (storage, XSS, CSS, mutations).
