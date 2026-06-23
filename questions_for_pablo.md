# Questions for Pablo — LinkedIn Career-Discovery Project

**Purpose.** Brainstorming dump + open decisions for the LinkedIn
career-exploration idea, so Pablo (and the rest of the team) can react,
push back, and help us lock direction before we build anything.

**Status:** ideation only — nothing built yet.

**Last updated:** 2026-06-23.

---

## 1. The idea in one paragraph

GenZ/GenAlpha don't have a good mental map of what jobs actually exist
beyond the generic ones (SWE, PM, "go work at a defense company"). A
mechanical-engineering student, for example, has no idea that satellite
communications, robotics, or field engineering are paths open to them.
Our idea: a **gamified exploration layer on LinkedIn** where students
explore job roles/fields (think a Duolingo-style streak + a "world map"
of fields they can wander through), get exposed to fields they've never
heard of, and — once something sparks interest — LinkedIn uses the data
it already has on them to compare their profile against that field, use
AI to identify the gaps, and lay out concrete steps (Khan-Academy-style
% mastery / progress) to get them closer to it.

Three layers:
1. **Explore** — breadth + serendipity. A gamified "world" of fields;
   streaks to drive engagement; reveal fields you didn't know existed.
2. **Compare** — once interested, compare the user's profile to the
   field using their LinkedIn data.
3. **Close the gap** — AI identifies what's missing, explains
   where/how/what steps, and tracks % similarity / mastery over time
   (recommend courses that teach the missing skills).

---

## 2. The core insight we think holds it together

Everything in the idea collapses onto **one unit: skills.** That's the
connective tissue across all three datasets and it makes the whole thing
computable rather than hand-wavy:

- A **field/role** = a cluster of skills.
- A **user** = the skills they have (explicit + implied by degree, job
  history, posts).
- A **course** = the skills it teaches (already a field in the data).
- **Gap** = `role_skills − user_skills`.
- **% mastery** (the Khan-Academy bar) =
  `|user_skills ∩ role_skills| / |role_skills|`.
- **Path** = the ordered set of courses that teach your gap skills.

The "world map" can then be **data-driven**: lay fields out in 2D where
*proximity = skill overlap*. Adjacent fields share skills, so the map
itself tells a user "you're only 1–2 skills away from this field you've
never heard of." The streak = "explore N new fields/roles today."

**Question for Pablo:** does the skills-as-connective-tissue framing feel
right as the foundation, or is there a better atomic unit (e.g. projects,
day-in-the-life tasks, industries)?

---

## 3. The data problem (important)

We're basing everything on three sample datasets LinkedIn-style data:
`user_data.json` (2,000 users), `jobs_data.json` (1,000 jobs),
`course_data.json` (600 courses). After inspecting them:

- **Jobs are NOT niche — they're the opposite.** There are only **10
  distinct job titles** across all 1,000 jobs (Sales Rep, Marketing
  Specialist, HR Coordinator, SWE, UX Designer, PM, Financial Analyst,
  DevOps, Data Scientist, Customer Service Manager) and only **5
  industries** (Education, Technology, Retail, Healthcare, Finance). So
  the sample data contains exactly the generic roles GenZ *already*
  knows — there is no "satellite communications" or "field robotics"
  hiding in it.
- **Jobs have no `skills` field.** Only users and courses do, and they
  only share ~12 skills. So a role's skill profile has to be *inferred*
  (AI from position + description + industry, and/or from the skills of
  users who actually hold that job via `job_history`). That inferred
  role→skills map is the keystone of the whole product.
- Descriptions are templated/generic; courses-per-user is sparse (~0.6).

**Our likely answer (confirm with Pablo): we need richer, more varied
data.** The whole premise is "expose people to roles they've never heard
of," and the current dataset can't demonstrate that. Options:
- (a) **Demo the mechanic** on the 10 generic roles and argue it scales
  to real LinkedIn data. Honest but underwhelming for the core pitch.
- (b) **Synthesize a richer taxonomy** — generate a wider, more
  realistic set of roles/fields (incl. the niche ones the story is
  about) on top of the same skill engine.
- (c) **Reframe the unit:** the "world" is a map of **fields / skill
  clusters**, not job titles — which sidesteps the thin-title problem
  and is arguably truer to "explore fields you've never heard of."

**Questions for Pablo:**
- Do we have access to richer/real LinkedIn-style data, or should we
  generate a richer synthetic dataset?
- If we synthesize, how realistic does the role taxonomy need to be for
  the pitch to land?
- Is reframing the explorable unit from "job title" → "field/skill
  cluster" the right call?

---

## 4. Open design questions

1. **Atomic explorable unit** — job title, industry, or a "field" we
   define as a skill cluster? This decides what the map's tiles are.
2. **Gamification: core loop vs. wrapper.** Duolingo works because the
   core unit (a lesson) *is* the fun. Is the streak/world the core loop,
   or a retention wrapper around the real value (the gap→path)? What is
   our 2-minute "lesson" equivalent?
3. **The "world"/heatmap** — what does exploration actually feel like?
   Fog-of-war map you reveal? A heatmap of fit? A swipe/discovery feed?
   How do we balance serendipity (new fields) vs. relevance (fields you
   could actually reach)?
4. **AI gap analysis** — what exactly does AI do that a rules engine
   can't? (Likely: infer role→skills from messy text; explain gaps in
   natural language; suggest a personalized step order.) Where do we
   draw the line between AI and deterministic skill math?
5. **Profile signals** — beyond explicit skills, how much do we lean on
   degree, job history, and `posts_activity` free text to infer where
   someone is? (posts_activity is unstructured — AI candidate.)
6. **Mastery model** — is % similarity purely skill-overlap, or
   weighted (some skills matter more for a field)? Where does course
   completion feed back into the score?
7. **Privacy / tone** — telling a young user "your profile is far from
   X" is sensitive. How do we make gaps feel like an adventure map, not
   a rejection?
8. **Scope of first artifact** — written concept/pitch, clickable
   mockup, or a working demo off this data? (Ava's current lean: lock
   the concept first.)

---

## 5. Things we think we believe (to validate)

- Skills are the right connective tissue.
- The map should be skill-overlap-driven, not hand-placed.
- We almost certainly need richer/more varied job data than the sample.
- AI's highest-value job is inferring role→skills from unstructured text
  + explaining gaps in human language — not the arithmetic.

---

## 6. Parking lot (raised, not yet discussed)

- Where does this live in the LinkedIn product surface (a tab? a
  standalone "Explore" mode? onboarding for students?).
- How do we measure success (engagement streaks vs. real path progress
  vs. eventual job outcomes)?
- Could the "world map" be social (see where friends/alumni from your
  school ended up)? `school_history` + `job_history` could support an
  "alumni paths" view.
