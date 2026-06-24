# Comparison Page (Role Detail + Fit Math) — Person B's slice

The role-detail panel that opens when a user clicks a role: what the role is,
who's hiring, a **% fit ring**, the **have vs. missing skills** gap, an
**analysis line** ("2,000 profiles analyzed…"), and a **"Build my path"** button
that hands the gap to the Milestone page.

**"You" is a single logged-in profile** (like being signed into LinkedIn) — there
is no profile picker. You pick a **role**; the app **invisibly** compares your
profile against everyone in the database who landed that role and surfaces only
the aggregate result — e.g. *"2,000 profiles analyzed · 383 landed this role ·
111 started with skills like yours."* Individual profiles are never shown; the
analysis (the common skills landers have that you don't) feeds the Milestone
page's course recommendations.

> Data note: the sample data is randomly generated, so *which* role someone
> landed doesn't strongly correlate with their skills. The counts shown are real;
> the role-specific signal is weak. Honest caveat for the demo.

## Data comes from the real sample files

The backend has **no data files of its own**. `backend/build_data.py` reads the
three real datasets in `sample_data/` (`user_data.json`, `jobs_data.json`,
`course_data.json`) and builds the app's data **in memory at startup** — so the
API always reflects whatever is in `sample_data/`.

`backend/precompute.py` uses the same `build_data` module to write the
**frontend's** bundled JSON (`frontend/data/*.json`), which the Next.js app uses
as an offline fallback and demo.html embeds. Re-run after editing sample data or
the curated skill lists: `python3 backend/precompute.py`.

What's **real** (derived from the files):
- roles: real companies, industries, salary range, levels, **real `easy_apply`
  flag**, real templated description, real `jobCount`, and 5 real job postings
  (id/company/location/salary/level/easyApply) — all from `jobs_data.json`.
- you ("me"): a real user from `user_data.json` (real name, degree, skills).
- analysis: per-role aggregate counts over people who landed it (analyzed /
  landed / share-your-skills) — counts only, no individual profiles exposed.
- courses: skill → real courses from `course_data.json` (for the Milestone page).

What's **curated** (the only hand-authored part): each role's `skills` list.
`jobs_data.json` has no skills field, and aggregating the skills of users who
hold each role is noise (the sample data is randomly generated — verified), so
role→skills is hand-authored. **Every curated skill is drawn from the 30 skills
that actually appear in `user_data.json`** so that real users reach non-zero fit
on every role. (Earlier versions used soft skills like "Communication"/"Scrum"
that no user has, which forced several roles to 0% for everyone — fixed.)

The role list in the left rail is a **search box**: type to filter roles by
name, category, or skill.

## What's here

```
sample_data/             # the ONLY source of data (user/jobs/course _data.json)
backend/
  build_data.py          # reads sample_data/*, builds roles/users/courses (source of truth)
  precompute.py          # uses build_data to write frontend/data/* (run after data edits)
  fit.py                 # compute_fit() — flat skill overlap (PURE)
  main.py                # FastAPI (/api/roles,/api/me,/api/courses,/api/fit); builds from sample_data/ at startup
  requirements.txt
frontend/
  lib/types.ts           # Role / User / FitResult contract
  lib/fit.ts             # computeFit() — mirror of fit.py (demo-safe fallback)
  lib/api.ts             # fetch /api/* ; falls back to bundled JSON if backend down
  data/*.json            # offline fallback (roleSkills/me/analysis/courses), from precompute.py
  components/ComparisonPanel/{ComparisonPanel,FitRing,SkillColumns}.tsx
  app/{layout,page}.tsx  # standalone demo harness (fixed profile + role search)
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
Case-insensitive. `fit.py` and `lib/fit.ts` are verified identical across all
roles. The analysis counts role-holders (via `job_history`) and how many share
>=1 skill with you — aggregate only.

## Demo story

"You" are `user_5329` (a real Economics grad). Pick **Financial Analyst** → 67%
fit, and the analysis line reports how many of the 383 landers started with
skills like yours. Pick **DevOps Engineer** → 33% (your security skills transfer
to a field you'd never consider) — the "you're closer than you think" moment.

## Integration notes for the team

- **Person A (map):** role node ids must match `roleSkills.json` keys
  (`software_engineer`, `devops_engineer`, …). Open `<ComparisonPanel roleId />`
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
