# Comparison Page (Role Detail + Fit Math) — Person B's slice

The role-detail panel that opens when a user clicks a role on the map: what the
role is, who's hiring, a **% fit ring**, the **have vs. missing skills** gap, and
a **"Build my path"** button that hands the gap to the Milestone page.

## What's here

```
backend/
  data/roleSkills.json   # canonical role -> skills/description/companies (10 roles)
  data/users.json        # 5 demo users incl. hero (Alex Rivera, user_5329)
  fit.py                 # compute_fit() — flat skill overlap (PURE)
  main.py                # FastAPI: /api/roles, /api/users, /api/fit
  requirements.txt
frontend/
  lib/types.ts           # Role / User / FitResult contract
  lib/fit.ts             # computeFit() — mirror of fit.py (demo-safe fallback)
  lib/api.ts             # fetch /api/* ; falls back to bundled JSON if backend down
  data/*.json            # copy of backend/data (bundled for the fallback)
  components/ComparisonPanel/{ComparisonPanel,FitRing,SkillColumns}.tsx
  app/{layout,page}.tsx  # standalone demo harness (user + role picker)
```

## Run it

**Backend** (Python 3.7+; FastAPI):
```bash
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload      # run from repo root; open http://localhost:8000/docs
```
Verified running live against Python 3.7 — all endpoints + error cases (404/422) pass.

**Frontend** (Node 18+):
```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

`next.config.js` proxies `/api/*` → `localhost:8000`, so no CORS. **If the backend
isn't running, the page still works** via the bundled-JSON fallback in `lib/api.ts`.

## The fit math

Flat skill overlap: `percent = |userSkills ∩ roleSkills| / |roleSkills|`, rounded.
Case-insensitive. `fit.py` and `lib/fit.ts` are verified identical across all 50
demo user×role combos (denominators never hit a .5 rounding edge).

## Demo story (the hero)

Pick **Alex Rivera** (⭐, an Economics grad). Expected: **67% Financial Analyst**
(obvious) — but **33% DevOps Engineer**, because her Information Security /
Network Security skills transfer to a field she'd never consider. That's the
"you're closer than you think" moment.

## Integration notes for the team

- **Person A (map):** role node ids must match `roleSkills.json` keys
  (`software_engineer`, `devops_engineer`, …). Open `<ComparisonPanel userId roleId />`
  on click. `GET /api/roles` returns the role list for the map.
- **Person C (Milestone):** "Build my path" calls
  `onBuildPath({ roleId, missingSkills })`. 29/36 role skills map to a course in
  `course_data.json` for the path builder.

## Data caveat (important, verified)

The sample data is randomly generated — a user's `job_history` does **not**
correlate with their skills (aggregating holders' skills makes "Software Engineer"
look like it needs "Economics"). So role→skills here is a **hand-authored
canonical map**, with skills chosen to intersect the real user/course skill
vocabulary so fits land at believable values and missing skills map to real courses.
