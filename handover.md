# LinkedIn Career-Discovery — Handover

Single-file context for anyone (human or AI chat session) joining this
project. Modeled on the BOSH Dashboard team handover. Read this first.

**Last rewritten:** 2026-06-23 (Ava) — project kickoff / ideation.

---

## 1. Read this first (boot sequence)

1. Read this whole file.
2. Read `questions_for_pablo.md` — the live brainstorming + open
   decisions. That's where the actual thinking lives right now.
3. We are at **ideation only — nothing is built.** Do not write app
   code until the concept is locked (see §4 Open decisions).
4. Before changing anything, say what you understand the state to be and
   what you intend to pick up. Confirm before modifying.

---

## 2. The project in one paragraph

A gamified career-exploration layer for LinkedIn aimed at
GenZ/GenAlpha, who don't know what jobs exist beyond the generic
(SWE/PM/defense). Users explore a "world" of fields/roles (Duolingo-style
streaks for engagement), get exposed to fields they've never heard of,
and — when interested — LinkedIn compares their profile to that field,
uses AI to find the gaps, and gives Khan-Academy-style steps + % mastery
to get there. Full concept + rationale in `questions_for_pablo.md`.

**Core bet:** everything reduces to **skills** as the connective tissue
(field = skill cluster; user = skills held; course = skills taught; gap =
difference; path = courses that close it; mastery % = overlap).

---

## 3. Current state (snapshot)

- **Phase:** ideation. No code, no app, no chosen stack.
- **Repo:** not yet initialized as git / not yet pushed anywhere (see
  §6 for the plan).
- **Artifacts so far (all in repo root):**
  - `questions_for_pablo.md` — brainstorming + open questions.
  - `handover.md` — this file.
  - `user_data.json`, `jobs_data.json`, `course_data.json` — the sample
    datasets we're designing against.
- **Team:** Ava + Pablo + others (multi-person; collaborating via git —
  setup pending, see §6).

---

## 4. Open decisions (blocking real work)

These are the things to settle before building. Full detail in
`questions_for_pablo.md` §3–4.

1. **Data variety.** The sample jobs data has only **10 job titles / 5
   industries** and no `skills` field — it can't demonstrate
   "discover roles you've never heard of." Likely need richer/more
   varied data (real or synthesized). DECISION PENDING with Pablo.
2. **Explorable unit** — job title vs. industry vs. "field" (skill
   cluster). Decides what the map is made of.
3. **Gamification** — is the streak/world the core loop or a wrapper?
   What's the 2-minute "lesson" equivalent?
4. **AI's role** — inferring role→skills from unstructured text +
   explaining gaps, vs. deterministic skill math.
5. **First artifact** — concept doc / clickable mockup / working demo.

---

## 5. Data reference (sample datasets)

| File | Records | Key fields |
|---|---|---|
| `user_data.json` | 2,000 | `school_history` (degree, grad_year), `job_history` (→ job IDs), `current_location`, `posts_activity` (free text), `skills`, `courses` (→ course IDs) |
| `jobs_data.json` | 1,000 | `company`, `location`, `position`, `salary_range` {from,to}, `industry` (5 only), `level`, `easy_apply`, `description` (templated) |
| `course_data.json` | 600 | `name`, `category`, `skills` (list), `length` {value,unit}, `level` |

Known data facts (measured 2026-06-23):
- Jobs: 10 distinct titles, 5 industries, **no skills field**.
- ~30 distinct user skills, ~34 course skills, only ~12 overlap.
- `job_history` links a user to the jobs they've held (career-path
  reconstruction is possible).
- `posts_activity` is unstructured free text (AI signal candidate).

---

## 6. Git / collaboration setup (PLAN — not done yet)

See the separate explanation Ava is getting; short version: this is a
**public GitHub repo** (this is a personal/external project, NOT Amazon
internal Brazil/CRUX). Once created:
- `main` is the shared branch; work on feature branches; open Pull
  Requests for review before merging.
- Don't commit secrets. The sample JSON datasets are fine to commit
  (they're synthetic).
- Keep this `handover.md` + `questions_for_pablo.md` updated as the
  source of truth so any new collaborator (or AI session) can catch up.

---

## 7. House rules

- **Ideation phase: no app code until the concept is locked.**
- Keep `handover.md` current — rewrite §3–4 when state changes; this is
  the boot file for new people/sessions.
- Put open questions + thinking in `questions_for_pablo.md`, not buried
  in chat.
- Public repo → no secrets, no private LinkedIn data; sample/synthetic
  data only.
- Per the team's choice: feature branches + Pull Requests, review before
  merge to `main`.

---

## 8. Where things live

- **Brainstorming / open decisions:** `questions_for_pablo.md`
- **This handover:** `handover.md`
- **Sample data:** `user_data.json`, `jobs_data.json`, `course_data.json`
- **Code:** none yet.
