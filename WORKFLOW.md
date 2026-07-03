# WORKFLOW.md — How to run a SITEWORK session with Claude Code

This is the standing operating manual. `CLAUDE.md` explains the codebase. `ROADMAP.md` tracks phases. This file explains **how to work** — where files live, how to brief Claude efficiently, how to resume between sessions, and how to log progress.

Aim: scannable in 2 minutes, executable without thinking.

---

## 1. Repo map — what lives where

**The canonical baseline** is `legacy/index.html` — serve on http://127.0.0.1:8766/ (`cd legacy && python3 -m http.server 8766 --bind 127.0.0.1`). See `PARITY.md` for the baseline contract. Ongoing development happens at `sitework/` (Vite + React 19 + TypeScript + Tailwind v4), which is an incomplete port being brought to parity with the baseline (Phase 4.6, sessions P1–P5).

**Tracked in git** (committed, pushed to GitHub):
- `sitework/` — the app, package-managed via npm
- `CLAUDE.md` — codebase guide for Claude
- `ROADMAP.md` — phase tracker + session log
- `WORKFLOW.md` — this file
- `ARCHITECTURE.md`, `DATA_MODEL.md`, `CONTRACTS_REFERENCE.md`, `HANDOFF.md` — companion docs
- `vercel.json` — deployment config
- `.github/workflows/sitework-ci.yml` — CI
- `.gitignore`

**Not tracked** (gitignored, stays local):
- `sitework/node_modules`, `sitework/dist`, `sitework/playwright-report`, `sitework/test-results`
- `*.bak`, `*.xlsx` — historical snapshots / spec docs
- `.claude/` — Claude session state, settings, worktrees

**Outside the repo, but matters**:
- Memory: `~/.claude/projects/-Users-andrewcamilleri-Downloads-SITEWORK---SaaS/memory/` — facts about the project and you that persist across sessions
- Plans: `~/.claude/plans/` — per-session plan files Claude writes when in plan mode

---

## 2. Starting a session — 30-second checklist

```bash
cd "/Users/andrewcamilleri/Downloads/SITEWORK - SaaS"
git pull
```

Open Claude Code. First message is one line, e.g.:

> Continue with phase 0-G: subcontractors edit flow. Read ROADMAP.md and CLAUDE.md before starting.

That's enough. Don't paste the roadmap, don't re-explain the architecture — Claude has `CLAUDE.md` and memory.

---

## 3. Token efficiency — how to brief Claude

**Do**
- Name the phase, the module, and the goal in one sentence. Let Claude read files itself.
- For unknown territory, ask Claude to use the **Explore subagent** ("explore where invoice approval is wired up") — it returns a digest instead of dumping files into the main conversation.
- Use **plan mode** (`shift+tab` twice) for anything beyond a one-line edit. A minute of planning saves backtracking.

**Don't**
- Paste large code blocks unless Claude asked for them.
- Re-explain things already in `CLAUDE.md` or memory.
- Open a fresh session for a continuation if the current one is still warm — context carries over within a session for free.
- Use `/clear` mid-task. Use it only between **unrelated** tasks.

**Rule of thumb**: if you're typing more than 3 sentences before letting Claude read files, you're spending tokens you didn't need to spend.

---

## 4. Picking up where we left off — resume ritual

- `ROADMAP.md` is the source of truth for **what's next**.
- The Session Log table at the bottom of `ROADMAP.md` is the source of truth for **what just happened**.
- First message of a new session: name the phase from ROADMAP.
- If you ever interrupt mid-feature: leave a one-line `🔄 in progress` note under that phase in ROADMAP before closing. Future-you reads it and resumes without guessing.

---

## 5. Adding or editing a feature — the standard loop

1. **Branch off main**:
   ```bash
   git checkout main && git pull
   git checkout -b phase-X-some-feature
   ```
   One branch per phase or self-contained feature.

2. **Plan mode** for anything non-trivial. Approve the plan before edits.

3. **Edit normal TypeScript/TSX files** under `sitework/src/`. Vite HMR shows changes in the browser in ~200 ms. No bracket-balance dance, no string-replace surgery.

4. **Verify locally** before commit:
   ```bash
   cd sitework
   npm run format:check && npm run lint && npm run typecheck && npm run test && npm run build
   npm run test:e2e   # Playwright — boots Vite at :5173, runs all specs
   ```
   CI runs the same gates on every PR; matching them locally avoids the round-trip.

5. **Commit**:
   ```bash
   git add sitework
   git commit -m "phase X: what changed"
   ```
   One commit per logical change. Multiple commits per branch is fine.

6. **Push and open PR**:
   ```bash
   git push -u origin phase-0g-subs-edit
   gh pr create   # if gh CLI installed
   ```
   If `gh` isn't installed (`brew install gh && gh auth login` once to set it up), the `git push` output prints a URL like `https://github.com/worksite-studio/sitework/pull/new/phase-0g-subs-edit` — open it in the browser to create the PR.

   PR description = what changed + how to test. Even solo, a PR gives you a diff view, a comment thread, and a permanent record beyond the commit message.

7. **Merge** when verified. Squash-merge keeps `main` history clean.

8. **Update `ROADMAP.md` on `main`**: tick the phase box, add a Session Log row.
   ```bash
   git checkout main && git pull
   # edit ROADMAP.md
   git add ROADMAP.md && git commit -m "Roadmap: tick 0-G, log session"
   git push
   ```

---

## 6. Logging — what to write, where

| Where | When | What |
|---|---|---|
| Commit message | Every commit | Imperative one-liner with phase tag (e.g. `phase 0-G: subcontractor edit modal`) |
| `ROADMAP.md` Session Log | End of session | Date `YYYY-MM-DD` + one sentence on what landed |
| `ROADMAP.md` phase header | End of phase | Flip status emoji to ✅ |
| Memory | When a decision should outlive this session | Tell Claude: "remember: we always X". It saves to memory. |

ROADMAP carries **phase progress**. Memory carries **durable preferences and facts**. Don't confuse them.

---

## 7. Repo invariants — do not break

- All five local gates (`format:check`, `lint`, `typecheck`, `test`, `build`) must pass before commit. CI runs the same — matching locally avoids the round-trip.
- `sitework/node_modules`, `sitework/dist`, `sitework/playwright-report`, `sitework/test-results` never committed (in `sitework/.gitignore` — verify if unsure).
- `.bak` / `.xlsx` / `.claude/` never committed (in root `.gitignore`).
- No secrets in committed files. Auth is via SSH key (`~/.ssh/id_ed25519`) — `git remote -v` shows `git@github.com:…`, no token. If you ever set up a new machine, generate a new SSH key per machine; don't copy the private key around.
- `main` always deploys cleanly. Vercel auto-deploys from `main` (see `vercel.json`). If a merge breaks `main`, revert the merge commit before fixing forward.

---

## 8. When to ask for what

| Task type | How to brief Claude |
|---|---|
| Typo / one-line fix | Drop into a session, no plan mode |
| Feature in an existing module | Plan mode, single Explore agent if mapping needed |
| New module or cross-cutting change | Plan mode, multiple Explore agents in parallel, written plan reviewed |
| Phase transition (e.g. Phase 4 React scaffold) | Dedicated session, plan mode mandatory, expect clarifying questions |

**On scoping cross-cutting polish.** When retrofitting a pattern across many components (validation, empty states, typography, error handling), scope to **every** affected component, not just the high-traffic subset. Half-finished polish creates inconsistent UX *worse* than no polish — users develop muscle memory expecting the new behaviour, then get silent failure on a less-common form. Acceptable to stage by **component family** (e.g. all o.jsx forms in one PR, all createElement-style forms in a follow-up), but not by "high-priority subset". Surfaced in session 19 mid-smoke-test when 5 forms were validated and 10 weren't.

---

## 9. Deployment

Vercel auto-deploys from `main` (and per-PR preview deploys). Wiring lives in the root `vercel.json`:

- Build command: `cd sitework && npm ci && npm run build`
- Output directory: `sitework/dist`
- SPA rewrite: every URL falls through to `index.html` so React Router handles client-side routing

To wire up a fresh Vercel project for this repo:
1. In the Vercel dashboard, **New Project** → import `worksite-studio/sitework`
2. **Framework preset:** Other (the `vercel.json` config takes over)
3. Leave the root directory as `./` — `vercel.json` cd's into `sitework/` itself
4. Deploy. First deploy ~1 minute; subsequent pushes auto-build via the GitHub integration.

The legacy `index.html` deployment (GitHub Pages on the old single-file app) is no longer used for hosting — but the file itself lives on as the canonical baseline at `legacy/index.html` (see `PARITY.md`).

---

## 10. Follow-ups parked for later sessions

- **Phase 2 docs**: `ARCHITECTURE.md` and `DATA_MODEL.md` (per ROADMAP) slot into the same root-level docs pattern as this file.
- **Git identity**: commits currently land as `Andrew Camilleri <andrewcamilleri@Andrews-MacBook-Pro.local>` (the local hostname). For proper GitHub attribution, run once: `git config --global user.email "<your-github-email>"` and `git config --global user.name "<Your Name>"`.

---

*Last updated: 2026-05-16. Scope principle added in §8 (session 19).*
