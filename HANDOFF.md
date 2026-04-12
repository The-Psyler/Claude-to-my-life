# HANDOFF — 2026-04-12 (session 2)

## Status
Phase 4 (Closed Alpha Distribution) — app deployed to GitHub Pages, ready for testers.

## Completed this session
- Merged `checkpoint-before-upgrades` (19 commits) into `main`, deleted branch
- Fixed broken script paths after src/static split
- Removed hardcoded SEED_VAULT and karma=47 defaults (clean start)
- Removed dead `db.playbook` references (table no longer in schema)
- Fixed reset button (was failing silently on missing playbook table)
- Fixed deploy workflow trigger (`main` instead of deleted branch)
- Added bilingual welcome screen (HU/EN) with install instructions
- Added "How to install" button in Settings to reopen welcome page
- Fixed back button overlapping title text (padding-top + position:relative)
- Repo made public, GitHub Pages enabled and deploying

## Live URL
https://the-psyler.github.io/Claude-to-my-life/

## Pending
- Full QA pass on mobile (Android PWA install, iPhone Safari)
- Verify service worker update flow (testers get new versions automatically)
- Future ideas saved to memory: `~/.claude/projects/C--Users-PsyPC--claude/memory/project_ctml_future_ideas.md`
