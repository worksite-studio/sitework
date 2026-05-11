# SITEWORK

Construction finance SaaS for Australian builders. Single-page React 19 prototype.

## Run it

```bash
python3 serve.py
```

Opens at <http://127.0.0.1:3456>. No build step — `index.html` is pre-bundled.

## What's where

| File / folder | What it is |
|---|---|
| [`index.html`](index.html) | The whole app — React 19 + app code + seed data, single minified file (~400KB) |
| [`serve.py`](serve.py) | Local dev server |
| [`CLAUDE.md`](CLAUDE.md) | Codebase guide: minified-name map, edit workflow, bracket-balance check |
| [`WORKFLOW.md`](WORKFLOW.md) | Session operating manual: how to brief Claude, the standard edit loop, logging |
| [`ROADMAP.md`](ROADMAP.md) | Phase tracker + session log |
| [`docs/`](docs/) | Spec material — finance model, design system, external reference |
| `.claude/` | Local Claude Code state (gitignored) |

## /docs/ contents

- [`docs/finance-model/`](docs/finance-model/) — Preliminary finance model spreadsheets being absorbed into the app. See the folder README for parity-audit status.
- [`docs/design/`](docs/design/) — Aesthetic refresh spec: NB Akademie type system, NB Form Std splash, pixel→glyph wordmark direction.
- [`docs/reference/`](docs/reference/) — External domain reference (Rawlinson rates, Xero docs, anything else used as input).

## For Claude chat collaborators

This repo is the single source of truth. To get oriented:

1. Read this README (you're here).
2. Read [`WORKFLOW.md`](WORKFLOW.md) for how sessions are run.
3. Read [`CLAUDE.md`](CLAUDE.md) for the codebase architecture and edit safety rules.
4. Read [`ROADMAP.md`](ROADMAP.md) to see what's done and what's next.
5. Browse [`docs/`](docs/) for spec material relevant to the conversation.
