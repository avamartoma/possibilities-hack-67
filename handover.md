# LinkedIn Career-Discovery — Handover

Single-file context for anyone (human or AI chat session) joining this
project. Read this first.

**Last rewritten:** 2026-06-23 (Ava) — concept locked; build started.

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
to reach them. A **"Lock in" button on your profile** launches the
feature. From there you either **Explore** (click broad interest bubbles
to surface roles) or **Explain** (a chatbot router where you say what you
want). Both land you on a **Role Detail / Comparison page** that scores
your profile against the role (% fit + skills you have vs. miss, à la
Simplify). From there **"Build my path"** opens a **Milestone page** that
generates a concrete plan — a "dream profile" — pointing you to local
jobs, online courses, and certifications that close each missing skill.
A **streak** (and maybe a local leaderboard) wraps it for engagement.

**Core bet:** everything reduces to **skills** as the connective tissue
(role = skill cluster; user = skills held; course = skills taught; gap =
difference; path = what closes it; fit % = overlap).

---

## 3. Current state (snapshot)

- **Phase:** building, modularly. Concept locked.
- **Stack (DECIDED):** **Python backend + React/TypeScript frontend.**
  Backend hosts the skill-overlap engine + AI inference; frontend is the
  pages. They talk over a JSON/HTTP API.
- **Data:** running on the existing sample data in `sample_data/` for
  now; we plan to get richer/more varied data later (the jobs data has
  no diversity — see §5 and §6). Not a blocker for building the pages.
- **Repo:** LIVE — public GitHub repo
  `https://github.com/avamartoma/possibilities-hack-67`, branch `main`.
  Local git identity: ava.martoma@gmail.com.
- **Code so far:** `milestone_generator.py` (Namyanzi, the Milestone
  page) is in the repo. Other pages not yet started.
- **Docs:** `README.md`, `handover.md` (this file),
  `ava_personal_notes.md` (Ava's full notes), `presentation_notes.md`
  (slide-ready summary for the deck).

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

---

## 5. Open questions (small; not blocking)

1. **Milestone page placement** — same page as the Role Detail, or a
   separate page? (Owner call: Daniel + Namyanzi.)
2. **Local leaderboard** — include alongside the streak, or streak only?
3. **Jobs-data diversity** — see §6; still open.

---

## 6. Data reference (sample datasets)

The three datasets live in `sample_data/`.

| File | Records | Key fields |
|---|---|---|
| `user_data.json` | 2,000 | `school_history` (degree, grad_year), `job_history` (→ job IDs), `current_location`, `posts_activity` (free text), `skills`, `courses` (→ course IDs) |
| `jobs_data.json` | 1,000 | `company`, `location`, `position`, `salary_range` {from,to}, `industry` (5 only), `level`, `easy_apply`, `description` (templated) |
| `course_data.json` | 600 | `name`, `category`, `skills` (list), `length` {value,unit}, `level` |

Known data facts (measured 2026-06-23):
- Jobs: **10 distinct titles, 5 industries, no `skills` field.** This is
  the one open data issue: the data has no role diversity, so it can't
  really showcase "discover roles you'd never heard of." We build against
  it for now; richer data comes later.
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
- **Sample data:** `sample_data/` (`user_data.json`, `jobs_data.json`,
  `course_data.json`)
- **Code:** `milestone_generator.py` (Milestone page, Namyanzi). More to
  come, one page per owner (§4).

---

## 10. Session log

### 2026-06-23 (session 2) — concept locked, build started
- **Stack decided:** Python backend + React/TypeScript frontend.
- **Concept pivoted and locked** to the Lock-in → Explore/Explain →
  Comparison → Milestone flow (§4). The hierarchical drill-down **map
  was dropped**; Explore is now **broad clickable bubbles**. Added the
  **"Lock in"** entry button and an **"Explain"** chatbot router.
- **Modular ownership** assigned across 5 people (§4).
- First code landed: `milestone_generator.py` (Namyanzi).

### 2026-06-23 (session 1) — project kickoff / ideation
- Defined the 3-layer concept (Explore → Compare → Close the gap) and the
  "skills as connective tissue" core insight.
- Inspected the 3 sample datasets; surfaced the key caveat (only 10
  generic job titles / 5 industries, no job skills field).
- Created the shared docs and stood up the public GitHub repo + initial
  commit. Drafted an early 3-screen wireframe (in `ava_personal_notes.md`).
