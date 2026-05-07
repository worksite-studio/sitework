# WORKFLOW.md — How to run a SITEWORK session with Claude Code

This is the standing operating manual. `CLAUDE.md` explains the codebase. `ROADMAP.md` tracks phases. This file explains **how to work** — where files live, how to brief Claude efficiently, how to resume between sessions, and how to log progress.

Aim: scannable in 2 minutes, executable without thinking.

---

## 1. Repo map — what lives where

**Tracked in git** (committed, pushed to GitHub):
- `index.html` — the entire app (React 19 + app code + seed data, single minified file)
- `serve.py` — local dev server (`python3 serve.py` → http://127.0.0.1:3456)
- `CLAUDE.md` — codebase guide for Claude
- `ROADMAP.md` — phase tracker + session log
- `WORKFLOW.md` — this file
- `.gitignore`

**Not tracked** (gitignored, stays local):
- `*.bak` — backup snapshots, redundant with git history
- `*.xlsx` — finance model reference docs
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
- No secrets in committed files. *Note:* the current `git remote -v` URL contains a GitHub PAT in plaintext — rotate it (see §10).
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

## 9. Loose files in the repo — what they are and how to clean up

The repo root currently has files that aren't tracked by git but sit alongside the source. They're gitignored, so they never reach GitHub — but they clutter the working directory and create small risks (accidental edits, confusion about source of truth).

### 9a. `sitework.html.bak` (~390 KB)

- **What it is**: a snapshot of `index.html` from before some earlier edit. Manual backup.
- **Why git already replaces it**: every committed version of `index.html` is recoverable via `git log` + `git show <sha>:index.html`. The `.bak` is redundant.
- **Risk**: low (gitignored), but if you open it by accident and edit it thinking it's `index.html`, you lose work silently.
- **Recommendation — delete it**:
  ```bash
  rm "sitework.html.bak"
  ```
  If you ever need that exact pre-rename version: `git log --all --oneline -- index.html` then `git show <sha>:index.html > recovered.html`.

### 9b. `Preliminary_Finance_Model_v6.xlsx` and `_v8.xlsx`

- **What they are**: financial model spreadsheets that SITEWORK is being built from. Reference/spec material, not source code.
- **Why they're gitignored**: `*.xlsx` is in `.gitignore`. Treated as private working docs.

**Three options — pick one**:

1. **Move out of the repo** *(recommended)*. Spec material lives where other working docs live. Repo stays focused on code.
   ```bash
   mkdir -p ~/Documents/sitework/reference
   mv Preliminary_Finance_Model_v*.xlsx ~/Documents/sitework/reference/
   ```

2. **Keep them where they are**. They don't pollute git (gitignored). One line of clutter in `ls`. Fine if you cross-reference them constantly.

3. **Track them in `/docs/` via Git LFS**. Versioned trail of model changes. Removes `*.xlsx` from `.gitignore`, requires `git lfs install` + `git lfs track "*.xlsx"`. Probably overkill until you have collaborators reviewing the model.

**Why option 1**: the v6/v8 versioning suggests these will keep evolving. Each new version sitting in the repo root is more clutter. Keep the latest in a known reference folder, repo stays focused on code.

### 9c. The general principle

The repo root should contain only files that are **either committed to git or actively used by the running app**. `serve.py` and `index.html` are runtime files. `CLAUDE.md`, `ROADMAP.md`, `WORKFLOW.md`, `.gitignore` are committed docs/config. Everything else is clutter or workspace state and should live elsewhere.

---

## 10. Follow-ups parked for later sessions

- **Rotate the GitHub PAT** currently embedded in `git remote -v`. Generate a new PAT in GitHub, revoke the old one, then either:
  - switch the remote to SSH: `git remote set-url origin git@github.com:worksite-studio/sitework.git`, or
  - use a credential helper: `git config --global credential.helper osxkeychain` and re-authenticate.
  *You* must do the rotation in GitHub — Claude can't.
- **Phase 2 docs**: `ARCHITECTURE.md` and `DATA_MODEL.md` (per ROADMAP) slot into the same root-level docs pattern as this file.

---

*Last updated: 2026-05-07.*
