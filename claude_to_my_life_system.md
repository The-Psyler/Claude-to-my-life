# Claude to My Life — System Guide

## The Core Philosophy
This is a **3-layer system**:
- **Layer 1 — Brain**: Google Docs / Notion / Notes app → your permanent, token-free storage
- **Layer 2 — Hub**: This chat → big picture thinking, system design, daily check-ins
- **Layer 3 — Workshop** : New chats → one per active idea, opened only when executing

---

## Your 4 Daily Touchpoints

### 1. Morning Boot (5 min) — THIS CHAT
Paste this every morning:
> "Morning. Energy: X/10. Priority: [one thing]. Question: [one thing on mind]."

Claude responds with: daily focus, any vault ideas worth revisiting, one nudge.

**What stays here**: your mood, priorities, open questions, system-level thinking.
**Token cost**: tiny — you're just orienting the day.

---

### 2. Idea Capture (async, 2 min each) — THIS CHAT
Any time a thought hits, drop it here raw:
> "New idea: [brain dump]"

Claude logs it, rates it, writes a vault entry.
You then **copy that entry into your Google Doc / Notes** (Layer 1).
That's your permanent record — not this chat.

**What stays here**: the conversation around the idea.
**What goes to Layer 1**: the clean vault entry Claude generates.
**Token cost**: one exchange per idea.

---

### 3. Execution Sprint (20–45 min) — NEW CHAT
When you're ready to work ON an idea (not just think about it):
1. Open a new chat
2. Paste the vault entry for that idea from your Google Doc
3. Work, build, research, prototype
4. At the end, paste the updated vault entry back into your Google Doc

**What stays here (Hub chat)**: nothing from sprints — they live in their own chats.
**What goes to Layer 1**: updated vault entry after each sprint.
**Token cost**: contained to that one idea chat — doesn't bloat your Hub.

---

### 4. Evening Wrap (5 min) — THIS CHAT
End of day check-in:
> "Evening wrap. Did: [X]. Learned: [Y]. Tomorrow: [Z]."

Claude updates your Playbook entry and generates the **handoff summary** to paste into tomorrow's first message of THIS chat.

**Token cost**: tiny.

---

## Layer 1 — Your External Brain (Zero Token Cost)

### Recommended tool: Google Docs (free, accessible everywhere)

Create one doc called **"Claude to My Life — Vault"** with these sections:

```
=== IDEAS VAULT ===

[IDEA NAME]
Date: 
Category: 
State: New / Active / Paused / Done
Potential: Low / Medium / High
Summary: (2–3 sentences)
Feasibility notes:
Next action:
Last updated:

---

=== AI PLAYBOOK ===

[DATE] — [insight or power prompt]

---

=== ACTIVE CONTEXT ===
(paste here before each Hub session — delete after)
```

**Why Google Docs over Notion/Obsidian?**
- Works on phone, paste into Claude in 10 seconds
- No app to install or learn
- Claude can read Google Docs links directly if you paste the URL (use web fetch)
- Free forever

**Alternative: Apple Notes / Samsung Notes**
- Even faster on mobile
- Great for quick idea capture on the go
- Less structured but totally fine for the vault

---

## What Lives Where — The Rules

| Content | Lives in | Never in |
|---|---|---|
| Raw ideas, quick thoughts | Hub chat → then Layer 1 | Execution chats |
| Vault entries (clean) | Layer 1 (Google Doc) | Only pasted into chats when needed |
| Daily mood / energy | Hub chat | Layer 1 |
| Deep work on one idea | Execution chat | Hub chat |
| Playbook insights | Layer 1 | Only referenced in Hub |
| Code / prototypes | Claude Code or execution chat | Hub chat |
| Handoff summary | Pasted as first message of Hub each day | Saved permanently anywhere |

---

## Token Management Rules

**Rule 1 — Hub chat is for thinking, not building.**
The moment you start saying "let's build this" or "write me the code" — open a new chat.

**Rule 2 — One idea per execution chat.**
Don't mix OnTime app work with another idea in the same chat. Each idea gets its own workspace.

**Rule 3 — Layer 1 is your source of truth.**
After every meaningful exchange, copy the output to your Google Doc. Don't rely on scrolling back through chat history.

**Rule 4 — Paste only what's needed.**
Starting an OnTime execution chat? Paste only the OnTime vault entry. Not the whole vault.

**Rule 5 — Archive, don't delete.**
When a chat gets long and slow, generate a summary → paste into Layer 1 → open a fresh chat with just the summary as context.

---

## Tool Stack (Low Cost / Free)

| Tool | Role | Cost |
|---|---|---|
| Claude.ai (this) | Hub chat — thinking, capture, daily pipeline | Free tier |
| Google Docs | Layer 1 — permanent vault storage | Free |
| Claude.ai new chats | Execution sprints per idea | Free tier |
| Claude Code (CLI) | Building actual products / scripts | Free tier available |
| Artifacts (in chat) | Prototypes, mockups, interactive tools | Included |
| Voice memo app | Capture ideas when hands are busy | Free (built-in) |

### Bonus: Voice → Idea pipeline
Stuck in traffic or falling asleep with an idea? Record a voice memo.
Next morning, transcribe it (your phone does this automatically) and paste into Hub chat as a new idea capture. Zero friction.

---

## The Weekly Review (15 min — Sunday)

Once a week, open THIS chat and say:
> "Weekly review time. Here's my vault: [paste Google Doc vault section]"

Claude will:
- Spot synergies between ideas
- Flag any ideas that have gone stale
- Suggest which idea deserves the next execution sprint
- Update potential ratings based on what you've learned

This is the compounding moment — where the system gets smarter over time.

---

## Quick Reference Card

```
MORNING    → Hub chat  → "Morning. Energy X. Priority Y. Question Z."
IDEA HIT   → Hub chat  → "New idea: ..." → copy vault entry to Google Doc
BUILDING   → New chat  → paste vault entry → work → update Google Doc
EVENING    → Hub chat  → "Evening wrap. Did X. Learned Y. Tomorrow Z."
WEEKLY     → Hub chat  → paste full vault → review + synergies
```

---

## Current Vault (as of 2026-04-09)

**Idea #1 — Claude to My Life Pipeline**
- Category: Tech / Automation
- State: Active
- Potential: High
- Summary: Personal AI productivity system using Claude.ai as daily guide. Four-block daily routine: morning boot, idea capture, execution sprint, evening wrap. External brain in Google Docs for zero-token permanent storage.
- Next action: Create the Google Doc vault today (10 min)

**Idea #2 — OnTime App**
- Category: Income / Side project
- State: New
- Potential: High
- Summary: Social punctuality app. Late arrivals pay a penalty drink. Friends build a rep score. Venue partners offer discounts in exchange for better table management. Core flow sketched.
- Next action: Validate core mechanic with 2–3 friends — show them the flow sketch.

---

*Last updated: 2026-04-09*
