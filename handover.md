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
- **Repo:** LIVE — public GitHub repo
  `https://github.com/avamartoma/possibilities-hack-67`, branch `main`,
  initial commit pushed 2026-06-23. Local git identity:
  ava.martoma@gmail.com.
- **Artifacts so far (all in repo root):**
  - `README.md` — repo intro, points newcomers here.
  - `handover.md` — this file (team boot doc).
  - `questions_for_pablo.md` — brainstorming + open questions.
  - `ava_personal_notes.md` — Ava's full session notes (concept, data
    findings, git/tooling explanations, wireframe). Most detailed
    catch-up doc.
  - `.gitignore`.
  - `sample_data/` — `user_data.json`, `jobs_data.json`,
    `course_data.json` (the sample datasets).
- **Concept + wireframe:** 3-layer concept (Explore → Compare → Close
  the gap) defined; a 3-screen wireframe strawman drafted (in
  `ava_personal_notes.md` §7).
- **Team:** Ava + Pablo + others. Collaborate via the GitHub repo
  (add collaborators in repo Settings; branch + PR flow).

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

The three datasets live in `sample_data/`.

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

## 6. Git / collaboration setup (DONE — repo live)

This is a **public GitHub repo** (personal/external project, NOT Amazon
internal Brazil/CRUX): `https://github.com/avamartoma/possibilities-hack-67`.
- Git initialized locally, first commit pushed to `main` (2026-06-23).
- `main` is the shared branch; work on feature branches; open Pull
  Requests for review before merging.
- Auth over HTTPS uses a Personal Access Token (PAT) — a credential
  helper on Ava's machine already has one cached. New teammates create
  their own PAT (GitHub → Settings → Developer settings → Tokens) or use
  SSH keys. Details in `ava_personal_notes.md` §5.
- **Still TODO:** add teammates as collaborators (repo Settings →
  Collaborators).
- Don't commit secrets. The sample JSON datasets are fine (synthetic).
- Keep `handover.md` + `questions_for_pablo.md` updated as the source of
  truth so any new collaborator (or AI session) can catch up.

Daily workflow:
```bash
git pull origin main
git checkout -b my-feature
git add -A && git commit -m "..."
git push -u origin my-feature   # then open a PR into main
```

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
- **Ava's full session notes (most detailed catch-up):**
  `ava_personal_notes.md` — concept, data findings, git/tooling
  explanations, the wireframe, and a dated session log.
- **Sample data:** `sample_data/` (`user_data.json`, `jobs_data.json`,
  `course_data.json`)
- **Code:** none yet.

---

## 9. Session log

### 2026-06-23 — project kickoff
- Defined the 3-layer concept (Explore → Compare → Close the gap) and the
  "skills as connective tissue" core insight.
- Inspected the 3 sample datasets; surfaced the key caveat (only 10
  generic job titles / 5 industries, no job skills field) → likely need
  richer/varied data or reframe the explorable unit to fields/skill
  clusters.
- Created the shared docs (`questions_for_pablo.md`, `handover.md`,
  `README.md`, `ava_personal_notes.md`).
- Stood up the public GitHub repo + pushed the initial commit to `main`.
- Drafted a 3-screen wireframe strawman (in `ava_personal_notes.md` §7).
- No app code; no stack chosen. Next: react with Pablo, decide the data
  direction, pick the first artifact.
