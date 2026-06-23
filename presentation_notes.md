# Presentation Notes — LinkedIn Career-Discovery

Slide-ready summary of the project: problem, idea, flow, wireframe, tech
stack, data, team, and what makes it different. Pulled together for the
slides. Deeper detail lives in `handover.md` and `ava_personal_notes.md`.

**Project:** `possibilities-hack-67` ·
`https://github.com/avamartoma/possibilities-hack-67`
**Last updated:** 2026-06-23.

---

## 1. The problem (slide: "Why this exists")

Young people (GenZ/GenAlpha) **don't know what jobs exist** beyond the
few generic, high-visibility roles (SWE, PM, "go work at a defense
company").

- **Awareness gap** — you can't aspire to a path you've never heard of. A
  mech-eng student has no idea satellite comms, robotics, or field
  engineering are open to them.
- **It's getting worse** — as traditional pipelines (e.g. conventional
  SWE hiring) shift, everyone funnels harder toward the same known roles.
- **No bridge** — even when curiosity strikes, there's no clear,
  motivating way to answer *"how far am I from this, and what do I do
  next?"* The gap feels like a wall, not a path.

**One-liner:** *Young people can't pursue careers they don't know exist —
and even when curious, there's no concrete path from where they are to
where they could go.*

---

## 2. The idea (slide: "What we're building")

A career-discovery feature that **lives inside LinkedIn**. A **"Lock in"
button on your profile** launches it. You either **Explore** (browse
interest bubbles) or **Explain** (tell a chatbot what you want); both
take you to a **Comparison page** that scores your fit for a role, then a
**Milestone page** that builds your path to get there. A **streak**
(and maybe a local leaderboard) drives engagement.

**Core bet — skills are the connective tissue** (makes it computable):
- role = a cluster of skills
- user = the skills they have (explicit + implied by degree/jobs/posts)
- course = the skills it teaches
- **gap** = `role_skills − user_skills`
- **% fit / mastery** = `|user ∩ role| / |role|`
- **path** = the ordered courses/opportunities that close the gap

---

## 3. The flow (slide: "How it works" — one diagram)

```
   ┌─────────────────────────────┐
   │  "Lock in" on your profile  │   (owner: TBD)
   └──────────────┬──────────────┘
                  ▼
        ┌───────────────────┐
        │  Choose a way in   │
        └───────┬───────┬───┘
                ▼       ▼
   ┌────────────────┐  ┌──────────────────────┐
   │  EXPLORE        │  │  EXPLAIN              │
   │  interest        │  │  chatbot (router):    │
   │  bubbles →       │  │  describe interests   │
   │  roles in field  │  │  → routed to roles    │
   │  (Ava)           │  │  (Muhammed)           │
   └────────┬───────┘  └───────────┬──────────┘
            └───────────┬───────────┘
                        ▼
          ┌──────────────────────────────┐
          │  ROLE DETAIL / COMPARISON      │  (Daniel)
          │  • what the role is            │
          │  • companies you could join    │
          │  • your % fit / readiness      │
          │  • skills you have vs. miss    │
          │  (reference point: Simplify)   │
          └──────────────┬───────────────┘
                         ▼  "Build my path"
          ┌──────────────────────────────┐
          │  MILESTONE / BUILD MY PATH     │  (Namyanzi)
          │  generates a "dream profile":  │
          │  per missing skill → local     │
          │  jobs, online courses, certs   │
          └──────────────────────────────┘

        wrapped by:  🔥 streak   (+ maybe local leaderboard)
```

**Two entry points, one destination.** Explore and Explain both hand off
to the Comparison page in the same shape (a selected role + your
profile). Explain is **purely a router** to roles.

---

## 4. Page-by-page (slide: "The screens")

**① Lock in** *(owner: TBD — not yet assigned)*
Button on your own LinkedIn profile; the front door into the feature.

**② Explore** *(owner: Ava)*
Broad interest **bubbles** (Creative, Technical, …). Click one → see the
roles/careers in that field. For people who don't yet know what they
want. *(Replaced the earlier zoomable map.)*

**② Explain** *(owner: Muhammed)*
A **chatbot router**: describe your interests in your own words → routed
to specific roles. For people who already know their direction.

**③ Role Detail / Comparison** *(owner: Daniel)*
For a chosen role: what it is · companies you could work at · your
**% fit / job-readiness** · skills you have vs. skills you're missing.
**Reference point — Simplify:** screens a role's requirements against
your resume and scores the match (e.g. "AI + summer camp" ≈ 50%;
"Burger King, fries" ≈ 0%).

**④ Milestone / Build my path** *(owner: Namyanzi)*
"Build my path" generates a plan — a **"dream profile."** For each
missing skill it surfaces attainable, often **local** opportunities:
local jobs that build the skill, online courses, certifications.

**Engagement:** a **streak**, and maybe a **local leaderboard.**

---

## 5. Wireframe reference (slide: "Mock screens")

The Comparison and Milestone screens follow these strawman layouts
(carried over from the original wireframe; the Explore screen is now
bubbles, not a map).

**Comparison (Role Detail):**
```
┌──────────────────────────────────────────────────────────────┐
│  ← Back        🛰  Satellite Communications                    │
├──────────────────────────────────────────────────────────────┤
│  What it is: 2–3 sentence plain-English description            │
│  Day in the life · typical roles · sample employers            │
│  Your fit:   ▓▓▓▓▓▓░░░░  58% match                             │
│  ┌─ Skills you have ──────┐  ┌─ Skills to build ────────────┐  │
│  │ ✓ Signal Processing    │  │ ○ RF Engineering             │  │
│  │ ✓ Python               │  │ ○ Orbital Mechanics          │  │
│  └────────────────────────┘  └──────────────────────────────┘  │
│  [ ⭐ I'm interested → build my path ]                          │
└──────────────────────────────────────────────────────────────┘
```

**Milestone (Build my path):**
```
┌──────────────────────────────────────────────────────────────┐
│  🛰 Path to: Satellite Communications        58% → goal 100%   │
├──────────────────────────────────────────────────────────────┤
│  AI summary: "You're strong on the software side. The main     │
│  gap is RF/hardware fundamentals. Here's the shortest path:"   │
│  ●━━━━ Step 1  RF Engineering Basics    [course]   ✓ done       │
│  ●━━━━ Step 2  Orbital Mechanics 101    [course]   ▶ in progress│
│  ○      Step 3  Antenna Design           [course]   locked       │
│  Mastery ▓▓▓▓▓▓▓░░░  71%      🔥 keeps your streak alive        │
└──────────────────────────────────────────────────────────────┘
```

**Explore (bubbles) — concept:** clickable interest bubbles (Creative,
Technical, Science, Business, …); tapping a bubble expands to the roles
in that field. (Lo-fi mock to be drawn for the slides.)

---

## 6. Tech stack (slide: "How it's built")

| Layer | Choice |
|---|---|
| **Frontend** | **React + TypeScript** — the pages (bubbles, comparison, milestone, chatbot UI) |
| **Backend** | **Python** — skill-overlap engine + AI inference |
| **Frontend ↔ backend** | JSON / HTTP API |
| **Skill-overlap engine** | set math over skills (intersection / difference); **shared** by Comparison + Milestone |
| **AI** | infer role→skills from `position`+`description`; write the gap summary; Explain-chatbot routing |
| **Data (now)** | static JSON in `sample_data/` |

**Architecture note for the team:** one **shared % fit / skill-overlap
engine** (not reimplemented per page) so the Comparison score and
Milestone plan stay consistent. Agree the data/type contracts + page
hand-offs before building in parallel.

---

## 7. Data (slide: "What we're running on")

| File | Records | Key fields |
|---|---|---|
| `user_data.json` | 2,000 | school_history, job_history (→jobs), location, posts_activity (free text), skills, courses (→courses) |
| `jobs_data.json` | 1,000 | company, location, position, salary_range, industry (5), level, easy_apply, description |
| `course_data.json` | 600 | name, category, skills (list), length, level |

- Building on this sample data **now**; richer/more varied data later.
- **Known limitation (still open):** jobs have only **10
  titles / 5 industries and no `skills` field** — so role→skills is
  *inferred* (AI), and the data can't yet showcase truly niche roles.

---

## 8. Why it's different (slide: "Not just another career quiz")

Skill-gap tools (incl. LinkedIn Learning's own role guides) and gamified
student career apps already exist. Our defensible wedge:
- **Serendipity, not a quiz** — surface roles you'd never have searched
  for, via interest bubbles + skill adjacency.
- **Built on a real graph** — uses actual profiles + the trajectories of
  people who hold the jobs ("paths like mine"), not a questionnaire.
- **Targets industry-switchers & thin profiles** — the segment incumbents
  serve worst.

---

## 9. Team & ownership (slide: "Who's doing what")

| Page | Owner |
|---|---|
| Lock-in button | **TBD** (not yet assigned) |
| Explore (bubbles) | **Ava** |
| Explain (chatbot router) | **Muhammed** |
| Comparison / Role Detail | **Daniel** |
| Milestone / Build my path | **Namyanzi** (code started: `milestone_generator.py`) |

---

## 10. Open questions (slide: "What's still open")

1. Who owns the **Lock-in** button (undecided; not Jaden).
2. **Milestone**: same page as Role Detail, or separate?
3. **Local leaderboard** alongside the streak, or streak only?
4. **Jobs-data diversity** — still open (need richer/more varied data).
