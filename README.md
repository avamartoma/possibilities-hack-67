# possibilities-hack-67

A gamified career-exploration concept for LinkedIn, aimed at
GenZ/GenAlpha: help students discover job roles and fields they've never
heard of, then use their profile data + AI to map the gap between where
they are and a field they're excited about (Khan-Academy-style progress
and % mastery).

> **Status: concept locked — building modularly (one owner per page).**

## Start here

- **[`handover.md`](handover.md)** — single-file context for anyone
  joining the project. Read this first (locked flow + page ownership).
- **[`presentation_notes.md`](presentation_notes.md)** — slide-ready
  summary of the idea, flow, wireframe, and tech stack.
- **[`ava_personal_notes.md`](ava_personal_notes.md)** — Ava's full
  working notes and session log.

## Sample data

We're designing against three synthetic LinkedIn-style datasets in
`sample_data/`: `user_data.json` (2,000 users), `jobs_data.json` (1,000
jobs), `course_data.json` (600 courses). See `handover.md` §5 for the
schema.

## Run the prototype

The repository has one application stack:

- `frontend/` — Next.js product flow: Lock In → Explore / Explain →
  Comparison → Milestones.
- `backend/` — FastAPI role-fit, course, and milestone-plan API.

In separate terminals from the repository root:

```bash
python3 -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload
```

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The frontend falls back to bundled data when
the API is not running, but the FastAPI service enables the shared fit and
milestone endpoints.

## Contributing

Work on a feature branch and open a Pull Request into `main` for review.
Don't commit secrets — this is a public repo.
