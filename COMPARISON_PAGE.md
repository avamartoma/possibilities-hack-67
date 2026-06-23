# Comparison Page (Role Detail + Fit Math) — Person B's slice

The role-detail panel that opens when a user clicks a role on the map: what the
role is, who's hiring, a **% fit ring**, the **have vs. missing skills** gap, and
a **"Build my path"** button that hands the gap to the Milestone page.

## Data comes from the real sample files

`backend/precompute.py` reads the three real datasets in `sample_data/`
(`user_data.json`, `jobs_data.json`, `course_data.json`) and emits the app's
data into `backend/data/`. Re-run it with `python3 backend/precompute.py`.

What's **real** (derived from the files):
- roles: real companies, industries, salary range, levels, **real `easy_apply`
  flag**, real templated description, real `jobCount`, and 5 real job postings
  (id/company/location/salary/level/easyApply) — all from `jobs_data.json`.
- users: real users sampled from `user_data.json` (real name, degree from
  `school_history`, real `skills`).
- courses: skill → real courses from `course_data.json` (for the Milestone page).

What's **curated** (the only hand-authored part): each role's `skills` list.
`jobs_data.json` has no skills field, and aggregating the skills of users who
hold each role is noise (the sample data is randomly generated — verified), so
role→skills is hand-authored, with skills chosen to intersect the real user and
course skill vocabularies.

## What's here

```
backend/
  precompute.py          # reads sample_data/*, writes backend/data/* (run once)
  data/roleSkills.json   # 10 roles enriched from real jobs_data.json
  data/users.json        # 5 real users incl. hero (user_5329)
  data/courses.json      # skill -> real courses from course_data.json
  fit.py                 # compute_fit() — flat skill overlap (PURE)
  main.py                # FastAPI: /api/roles, /api/users, /api/courses, /api/fit
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

Pick the **⭐ hero** (`user_5329`, a real Economics grad from the dataset).
Expected: **67% Financial Analyst** (obvious) — but **33% DevOps Engineer**,
because their real Information Security / Network Security skills transfer to a
field they'd never consider. That's the "you're closer than you think" moment.

## Integration notes for the team

- **Person A (map):** role node ids must match `roleSkills.json` keys
  (`software_engineer`, `devops_engineer`, …). Open `<ComparisonPanel userId roleId />`
  on click. `GET /api/roles` returns the role list for the map.
- **Person C (Milestone):** "Build my path" calls
  `onBuildPath({ roleId, missingSkills })`. 29/36 role skills map to a course in
  `course_data.json` for the path builder.

## Data caveat (important, verified)

The sample data is randomly generated — a user's `job_history` does **not**
correlate with their skills (aggregating holders' skills makes "Software
Engineer" look like it needs "Economics"). That's why role→skills is the one
curated field (see "Data comes from the real sample files" above); everything
else — companies, salaries, levels, the real `easy_apply` flag, postings, users,
and course mappings — is derived from the real datasets by `precompute.py`.
