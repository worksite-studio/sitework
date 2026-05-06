# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the app

```bash
python3 serve.py   # serves index.html on http://127.0.0.1:3456
```

Configured in `.claude/launch.json` as the `sitework` server. The app is a single static file — no build step needed to test changes; just save and reload the browser.

## Architecture

**Single minified HTML file.** Everything — React, app code, seed data, styles — lives in `index.html` (~400KB). There is no build toolchain in this repo; the file is pre-bundled and committed directly.

- **Framework:** React 19.2.4 with JSX runtime (`o.jsx` / `o.jsxs`)
- **State:** One central `useReducer` in the root `Pc` component. All modules receive `{project, dispatch}` props. The reducer is `Z1`.
- **Entry point:** `Ap` component → splash screen `Lp` (click to enter) → `Pc` (full app)
- **Styling:** CSS-in-JS inline styles. Design tokens in object `d` (colours), `v` (fonts).

## Component / variable name map

The code is minified. Key mappings:

| Minified | Module |
|---|---|
| `Pc` | Root app shell (nav + routing) |
| `Y1v2` | Dashboard |
| `D1` | Project Overview (BOQ table) |
| `D1v2` | Project Overview (Contract vs Cost panel) |
| `B1` | Variations |
| `O1v2` | Invoices |
| `M1v2` | Purchase Orders |
| `Cl1` | Progress Claims |
| `k1v2` | Defects |
| `j1v2` | Cash Flow |
| `Z1` | Root reducer |
| `d` | Design token object (colours) |
| `v` | Font style object |
| `k()` | Currency formatter |
| `Ft()` | Date formatter |
| `He` | Status badge component |

## Making edits safely

Because the file is minified, **all edits are Python string replacements**. The workflow:

1. Find the exact string to replace using `python3 -c "... content.find(...)"` or `repr()` to see exact bytes
2. Verify the pattern is unique: `content.count(old_pattern)` must equal 1
3. Apply the replacement
4. **Always verify bracket balance after every edit:**

```python
python3 -c "
def count_balanced(s):
    parens = brackets = braces = 0
    in_str = None
    i = 0
    while i < len(s):
        c = s[i]
        if in_str:
            if c == '\\\\': i += 2; continue
            if c == in_str: in_str = None
        else:
            if c in ('\"', \"'\", '\`'): in_str = c
            elif c == '(': parens += 1
            elif c == ')': parens -= 1
            elif c == '[': brackets += 1
            elif c == ']': brackets -= 1
            elif c == '{': braces += 1
            elif c == '}': braces -= 1
        i += 1
    return parens, brackets, braces
with open('index.html','r',encoding='utf-8') as f: content = f.read()
print(count_balanced(content))  # must be (3, 3, 3)
"
```

The baseline is `(3, 3, 3)` due to template literals in the source. Any other result means a broken edit — `git checkout -- index.html` and retry.

5. If a pattern matches 0 times, use `repr()` to inspect exact bytes — encoding differences (e.g. `\xb7` vs `\xB7`) are a common cause.

## Reducer actions

Key existing actions (do not duplicate):

```
ADD_CLAIM, UPDATE_CLAIM, ADD_INVOICE, UPDATE_INVOICE
ADD_VARIATION, UPDATE_VARIATION
ADD_PROJECT, DUPLICATE_PROJECT
RECEIVE_PURCHASE
ADD_TIMESHEET, DELETE_TIMESHEET
ADD_RFI, UPDATE_RFI
ADD_DIARY, ADD_MILESTONE, UPDATE_MILESTONE
CREATE_ESTIMATE_FROM_TEMPLATE, PROMOTE_ESTIMATE
UPDATE_SETTINGS
```

## Git workflow

```bash
git add index.html ROADMAP.md
git commit -m "phase description: what changed"
git push origin main
```

Remote requires PAT auth — stored in remote URL. Push after every session.

## ROADMAP.md

Session log and phase tracker lives in `ROADMAP.md`. Mark phases ✅ and add a session log entry at the end of every session.

## Seed data structure

Seed data is inline in the script. Key collections on the initial state object passed to `Z1`:
- `projects[]` — each has `id`, `name`, `contractType`, `margin`, `codes[]`
- `claims{}` — keyed by projectId
- `invoices{}` — keyed by projectId
- `variations{}` — keyed by projectId
- `retention{}` — keyed by projectId, has `rate` field
- `rfis{}`, `diary{}`, `timesheets{}`, `milestones{}`, `defects{}` — keyed by projectId
