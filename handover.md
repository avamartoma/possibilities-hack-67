# LinkedIn Career-Discovery — Handover

Single-file context for anyone (human or AI chat session) joining this
project. Read this first.

**Last rewritten:** 2026-06-24 (Ava) — pages built; full flow integrated.

---

## 1. Read this first (boot sequence)

1. Read this whole file.
2. Read `ava_personal_notes.md` for the fuller backstory (concept
   evolution, data findings, git/tooling notes).
3. The concept is now **locked** (see §4 feature flow). We have moved
   from ideation into building, **modularly** — one owner per page.
4. Before changing a page you don't own, check with its owner (§4) so
   the shared seams (data contracts, % fit engine, page hand-offs) stay
   consistent.

---

## 2. The project in one paragraph

A career-discovery feature that lives **inside LinkedIn**, aimed at
GenZ/GenAlpha who don't have a good mental map of what jobs exist or how
to reach them. A persistent **Locked[IN]** button on the profile opens
Discover; the user can also move into the Career Guide. Selecting any role
directly opens **Your Path**, which shows readiness, gaps, and a concrete
milestone plan. The Guide uses the shared Render backend for Anthropic when
available and deterministic recommendations otherwise.

**Core bet:** everything reduces to **skills** as the connective tissue
(role = skill cluster; user = skills held; course = skills taught; gap =
difference; path = what closes it; fit % = overlap).

---

## 3. Current state (snapshot)

- **Phase:** building, modularly — **first pages are built and running.**
- **Stack (DECIDED):** **Python (FastAPI) backend + Next.js / React /
  TypeScript frontend.** They talk over a JSON/HTTP API; the frontend
  falls back to bundled JSON if the backend isn't running.
- **Data:** running on the synthetic sample data in `sample_data/`.
  `jobs_data.json` now has **207 distinct positions across 21 industries**
  (expanded 2026-06-23 from the original 10 titles / 5 industries) so it
  can showcase discovering unfamiliar roles. Jobs still have no `skills`
  field (role→skills is inferred). Real/richer data may come later.
- **Repo:** LIVE — public GitHub repo
  `https://github.com/avamartoma/possibilities-hack-67`, branch `main`.
- **The app is real now:** **Next.js + TypeScript** frontend (`frontend/`)
  + **FastAPI** backend (`backend/`). On `main`: Daniel's **Comparison
  page** (merged) and Namyanzi's **Milestone page** (Flask `app.py` +
  `frontend/public/milestones-demo.html`).
- **Built, on branches (not all merged to `main` yet) — see §7 branch map:**
  - **Explore** (Ava): clean slice on `explore-page` → **PR #3 open**.
  - **Explain** (Muhammed): `origin/muhammed-explain-chatbot` (separate Vite
    app); ported into Next on the integration branch.
  - **Daniel's latest** restyle: `origin/feature/comparison-page`.
  - **Full end-to-end flow** integrated on **`ava-explore`** (`AppFlow`:
    Lock-in → Explore/Explain → Comparison → Milestone).
- **Run it:** `cd frontend && npm install && npm run dev` →
  `http://localhost:3000` (`/` flow on `ava-explore`; `/explore`;
  `/comparison-demo`; `/milestones-demo.html`).
- **Docs:** `README.md`, `handover.md` (this file), `ava_personal_notes.md`
  (Ava's full notes — the most detailed catch-up), `presentation_notes.md`.

---

## 4. The feature flow + ownership (the locked concept)

End-to-end:
**Lock in → (Explore *or* Explain) → Comparison page → Milestone page**,
with a streak / optional local leaderboard around it.

| Step | Page | Owner | What it does |
|---|---|---|---|
| 1 | **Lock in** | **TBD** (not yet assigned) | A "Lock in" button on your own LinkedIn profile. Entry point; leads to a page offering the two ways in (Explore / Explain). |
| 2a | **Explore** | **Ava** | Broad interest **bubbles** (Creative, Technical, etc.) you click; each reveals the careers/roles in that field. For people who don't yet know what they want. **(No longer a map.)** |
| 2b | **Explain** | **Muhammed** | A **chatbot**, **purely a router**: you describe your interests, it routes you to specific roles. For people who already know what they want. |
| 3 | **Role Detail / Comparison** | **Daniel** | Both 2a and 2b converge here. For a chosen role: what it is, companies you could work at, your **% fit / job-readiness**, and skills you have vs. miss. Reference point: **Simplify** (scores resume vs. role requirements). |
| 4 | **Milestone / Build my path** | **Namyanzi** | "Build my path" generates a plan — a **"dream profile"** — and for each missing skill surfaces attainable, often **local** opportunities: local jobs, online courses, certifications. |

**Key integration seam:** both **Explore** and **Explain** must hand off
to the **Comparison page** in the *same shape* — a selected role + the
user's profile. The % fit / skill-overlap logic appears on both the
Comparison page and (implicitly) the Milestone page, so it should be
**one shared engine**, not reimplemented per page.

**Build status (2026-06-24):** all four are built. Comparison + Milestone
are on `main`; Explore is on `explore-page` (PR #3); Explain is ported and
the whole flow is wired on `ava-explore` (see §7). Lock-in owner still TBD
(not Jaden).

---

## 5. Open questions / known issues

1. **[PICK UP HERE] Explore → Comparison only covers 10 roles.** The
   Comparison's `roleSkills.json` has only the 10 canonical roles, but
   Explore surfaces all 207 — so clicking a niche role shows a "coming
   soon" card instead of a comparison. Agreed fix (not yet built): **infer
   `role→skills` for all 207 positions** (from holders' skills via
   `job_history` + industry/title), additive to Daniel's 10, and make
   `roleIdFor()` slug-derive the id. Touches Daniel's slice → do on
   `ava-explore`, coordinate with Daniel.
2. **Milestone page placement** — same page as the Role Detail, or a
   separate page? (Owner call: Daniel + Namyanzi.)
3. **Local leaderboard** — include alongside the streak, or streak only?

---

## 6. Data reference (sample datasets)

The three datasets live in `sample_data/`.

| File | Records | Key fields |
|---|---|---|
| `user_data.json` | 2,000 | `school_history` (degree, grad_year), `job_history` (→ job IDs), `current_location`, `posts_activity` (free text), `skills`, `courses` (→ course IDs) |
| `jobs_data.json` | 1,000 | `company`, `location`, `position` (**207 distinct**), `salary_range` {from,to}, `industry` (**21**), `level`, `easy_apply`, `description` (templated) |
| `course_data.json` | 600 | `name`, `category`, `skills` (list), `length` {value,unit}, `level` |

Known data facts (measured 2026-06-23):
- Jobs: **207 distinct titles across 21 industries** (expanded
  2026-06-23 from 10 titles / 5 industries), with company, location, and
  salary made coherent per role. Jobs still have **no `skills` field**.
- Role→skills must be **inferred** (AI from `position`+`description`,
  and/or from skills of users who hold the job via `job_history`).
- ~30 distinct user skills, ~34 course skills, only ~12 overlap.
- `posts_activity` is unstructured free text (AI signal candidate).

---

## 7. Git / collaboration setup

Public GitHub repo (personal/external project, NOT Amazon Brazil/CRUX):
`https://github.com/avamartoma/possibilities-hack-67`.
- `main` is the shared branch. Auth over HTTPS uses a cached PAT on
  Ava's machine; teammates create their own PAT or use SSH.
- **Pull before you start** — teammates push directly (e.g.
  `milestone_generator.py` landed straight on `main`), so `main` moves.
- Don't commit secrets. Sample JSON is synthetic and fine.
- Keep this file current — it's the boot doc for new people/sessions.

Daily workflow:
```bash
git pull origin main
# edit your page...
git add -A && git commit -m "..."
git push origin main      # (or a feature branch + PR if you prefer)
```

**Branch map (2026-06-24):**
- `main` — expanded `jobs_data` (207/21), Comparison (Daniel) + Milestone
  (Namyanzi) merged, current docs.
- `explore-page` — clean **Explore-only** slice (Ava). **PR #3 → main, open.**
- `ava-explore` — the **integration** branch (~10 ahead of main): everyone's
  work combined + Explore + `AppFlow` end-to-end flow. Not PR'd yet — wait
  until the other slices land on `main`, then PR/rebase so the diff is clean.
- `origin/feature/comparison-page` — Daniel's latest restyle (unmerged).
- `origin/muhammed-explain-chatbot` — Muhammed's Vite Explain (unmerged).

**Making PRs with `gh`:** `gh` (2.95.0) is installed but not logged in (the
cached git token lacks `read:org`, so `gh auth login` fails). Pass the token
via env instead:
```bash
GH_TOKEN=$(printf "protocol=https\nhost=github.com\n\n" | git credential fill | sed -n 's/^password=//p') \
  gh pr create --base main --head <branch> --title "..." --body-file <file>
```

---

## 8. House rules

- Concept is locked — build your **own page**; coordinate on shared
  seams (data contracts, the % fit engine, page hand-offs) before
  diverging.
- Keep `handover.md` current — it's the boot file; rewrite §3–4 when
  state changes.
- Public repo → no secrets, no private LinkedIn data; sample/synthetic
  data only.
- Pull before you start; `main` moves because teammates push to it.

---

## 9. Where things live

- **This handover:** `handover.md`
- **Ava's full notes (most detailed catch-up):** `ava_personal_notes.md`
- **Frontend (Next.js + TS):** `frontend/` — `app/` routes,
  `components/` (ComparisonPanel, Explore, Explain, Flow, LinkedInNav),
  `lib/` (types, fit, theme, explore, explain), `data/` (bundled JSON).
- **Backend (FastAPI):** `backend/` (`main.py`, `fit.py`, `data/`).
- **Milestone (Namyanzi):** `app.py` (Flask, Claude API) +
  `frontend/public/milestones-demo.html` + `static/`.
- **Sample data:** `sample_data/` (`user_data.json`, `jobs_data.json`,
  `course_data.json`).
- **Slice docs:** `EXPLORE_PAGE.md`, `COMPARISON_PAGE.md` (on their branches).

---

## 10. Session log

### 2026-06-24 (session 3) — Explore built + full flow integrated
- **Repo became a real app:** Daniel merged the Comparison page (Next.js
  `frontend/` + FastAPI `backend/`); Namyanzi merged the Milestone page
  (Flask + `milestones-demo.html`).
- **Ava built the Explore page** (`frontend/app/explore` + `components/Explore`
  + `lib/explore`): hierarchical bubble → field → job-title drill-down from
  `jobsCatalog.json`, with profile **eligibility filtering** (grad-year
  seniority + degree). Clean slice on `explore-page` → **PR #3 open**.
- **Integrated the full flow** on `ava-explore` (`AppFlow`): merged Daniel's
  latest, ported Muhammed's Explain to Next/TSX, embedded Namyanzi's
  milestone via iframe; one shared identity (`flowUsers.json`). Root `/` =
  flow; `/comparison-demo` preserves Daniel's demo. Build + typecheck clean.
- **Known issue / next:** Explore only leads to the Comparison for the 10
  canonical roles; the other ~197 show "coming soon" (jobs have no skills
  field). Fix = infer `role→skills` for all 207 (see §5 #1).

### 2026-06-23 (session 2) — concept locked, build started
- **Stack decided:** Python backend + React/TypeScript frontend.
- **Concept pivoted and locked** to the Lock-in → Explore/Explain →
  Comparison → Milestone flow (§4). The hierarchical drill-down **map
  was dropped**; Explore is now **broad clickable bubbles**. Added the
  **"Lock in"** entry button and an **"Explain"** chatbot router.
- **Modular ownership** assigned across 5 people (§4).
- First code landed: `milestone_generator.py` (Namyanzi).
- **Data expanded:** `jobs_data.json` regenerated from 10 titles / 5
  industries to **207 distinct positions across 21 industries**, with
  coherent company/location/salary per role; all job ids + schema
  preserved (user `job_history` refs still resolve).

### 2026-06-23 (session 1) — project kickoff / ideation
- Defined the 3-layer concept (Explore → Compare → Close the gap) and the
  "skills as connective tissue" core insight.
- Inspected the 3 sample datasets; surfaced the key caveat (only 10
  generic job titles / 5 industries, no job skills field).
- Created the shared docs and stood up the public GitHub repo + initial
  commit. Drafted an early 3-screen wireframe (in `ava_personal_notes.md`).
