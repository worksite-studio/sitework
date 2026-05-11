# WORKFLOW.md — How to run a SITEWORK session with Claude Code

This is the standing operating manual. `CLAUDE.md` explains the codebase. `ROADMAP.md` tracks phases. This file explains **how to work** — where files live, how to brief Claude efficiently, how to resume between sessions, and how to log progress.

Aim: scannable in 2 minutes, executable without thinking.

---

## 1. Repo map — what lives where

**Tracked in git** (committed, pushed to GitHub):
- `README.md` — landing page; what the repo is and where docs live
- `index.html` — the entire app (React 19 + app code + seed data, single minified file)
- `serve.py` — local dev server (`python3 serve.py` → http://127.0.0.1:3456)
- `CLAUDE.md` — codebase guide for Claude
- `ROADMAP.md` — phase tracker + session log
- `WORKFLOW.md` — this file
- `.gitignore`
- `docs/` — non-code spec material:
  - `docs/finance-model/` — preliminary finance model xlsx (v6 historical, v8 current) + parity-audit tracker
  - `docs/design/` — aesthetic refresh: NB Akademie/NB Form spec, locked decisions, open threads
  - `docs/reference/` — external domain reference (Rawlinson, Xero, AU construction conventions)

**Not tracked** (gitignored, stays local):
- `*.bak` — backup snapshots, redundant with git history
- `*.xlsx` at the repo root — scratch spreadsheets. The `!docs/finance-model/*.xlsx` negation in `.gitignore` keeps the committed finance models visible to git.
- `.claude/` — Claude session state, settings, worktrees

**Outside the repo, but matters**:
- Memory: `~/.claude/projects/-Users-andrewcamilleri-Downloads-SITEWORK---SaaS/memory/` — facts about the project and you that persist across sessions
- Plans: `~/.claude/plans/` — per-session plan files Claude writes when in plan mode
- Claude Project on claude.ai — wired to the GitHub repo via the GitHub connector so chat sessions see the same files Claude Code sees

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
   git checkout -b phase-0g-subs-edit
   ```
   One branch per phase or self-contained feature.

2. **Plan mode** for anything non-trivial. Approve the plan before edits.

3. **Edit** `index.html` using the Python-string-replace workflow in `CLAUDE.md`. After every edit, verify bracket balance is `(3, 3, 3)` (script in `CLAUDE.md`). If it isn't, `git checkout -- index.html` and retry.

4. **Verify in browser**: Claude runs `python3 serve.py` and clicks through the affected module using preview tools. Claude won't ask you to test manually.

5. **Commit**:
   ```bash
   git add index.html
   git commit -m "phase 0-G: subcontractor edit modal"
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

- `index.html` bracket balance must be `(3, 3, 3)` before every commit.
- `.bak` / `.xlsx` / `.claude/` never committed (already in `.gitignore` — verify before `git add` if unsure).
- No secrets in committed files. Auth is via SSH key (`~/.ssh/id_ed25519`) — `git remote -v` shows `git@github.com:…`, no token. If you ever set up a new machine, generate a new SSH key per machine; don't copy the private key around.
- `main` always deploys cleanly. If a merge breaks `main`, revert the merge commit before fixing forward.

---

## 8. When to ask for what

| Task type | How to brief Claude |
|---|---|
| Typo / one-line fix | Drop into a session, no plan mode |
| Feature in an existing module | Plan mode, single Explore agent if mapping needed |
| New module or cross-cutting change | Plan mode, multiple Explore agents in parallel, written plan reviewed |
| Phase transition (e.g. Phase 4 React scaffold) | Dedicated session, plan mode mandatory, expect clarifying questions |

---

## 9. The `/docs/` folder — non-code spec material

`/docs/` is the home for everything that *informs* the product but isn't code. It's version-controlled like the rest of the repo, which means a Claude Project connected to the GitHub repo can read it the same way it reads source.

### 9a. `docs/finance-model/`

The preliminary finance model spreadsheets the app is being built from. v8 is current and requires refinement inside the prototype; v6 is historical, kept until the parity audit confirms v8 fully supersedes it.

Treated as a **spec document being absorbed into the app**, not a permanent fixture:

- **Phase A — Parity audit**: walk v8 sheet-by-sheet against `index.html`, mark each line item ✅ / 🟡 / ❌ in `docs/finance-model/parity-audit.md`.
- **Phase B — Implementation**: lift 🟡 and ❌ items into ROADMAP as new phases.
- **Phase C — End-state**: once parity is reached, archive the xlsx in `docs/archive/finance-model/`, delete them, or keep them living. Decide at the time.

Until Phase C resolves, **`index.html` and `v8.xlsx` are mutually authoritative**: the app for what's built, v8 for what's still owed.

### 9b. `docs/design/`

Aesthetic refresh spec — locked decisions (NB Akademie type system, NB Form Std splash, pixel→glyph wordmark direction) and open threads (animation mechanics, NB Form placement, colour discipline, wordmark direction, print/PDF surface). Living document, updated as design sessions resolve threads.

HTML/image mockups, type specimens, colour cards live here when they exist.

### 9c. `docs/reference/`

External domain material — Rawlinson rate notes, Xero docs, AU construction conventions. Cited or quoted, not authored by us. Populate as gathered.

### 9d. General principle

Repo root = code + top-level docs (`README`, `CLAUDE`, `WORKFLOW`, `ROADMAP`).
`docs/*` = spec material, version-controlled, claude.ai-readable.
`.claude/` = local session state, never committed.

If a new artefact appears, ask: is it code? (root) is it spec? (`docs/`) is it session state? (`.claude/`). Anything else doesn't belong in the repo.

### 9e. Backups

Don't commit `.bak` snapshots — `.gitignore` blocks them. Every previous `index.html` is already recoverable: `git log --oneline -- index.html` then `git show <sha>:index.html > recovered.html`.

---

## 10. Follow-ups parked for later sessions

- **Phase 2 docs**: `ARCHITECTURE.md` and `DATA_MODEL.md` (per ROADMAP) slot into the same root-level docs pattern as this file.
- **Git identity**: commits currently land as `Andrew Camilleri <andrewcamilleri@Andrews-MacBook-Pro.local>` (the local hostname). For proper GitHub attribution, run once: `git config --global user.email "<your-github-email>"` and `git config --global user.name "<Your Name>"`.

---

*Last updated: 2026-05-12. `/docs/` structure introduced; finance models brought into the repo; root README added.*
