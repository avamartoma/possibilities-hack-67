"""Emit the frontend's offline-fallback JSON from the real sample datasets.

The backend builds its data in-memory at startup (see build_data.py / main.py),
so it needs NO pre-generated files. The Next.js frontend bundles JSON as an
offline fallback (see frontend/lib/api.ts) and demo.html embeds the same data —
those consumers can't run Python, so this script writes the JSON they import.

Run from repo root:  python3 backend/precompute.py
"""

import json
from pathlib import Path

from build_data import build_all, HERO_ID

OUT = Path(__file__).resolve().parent.parent / "frontend" / "data"

roles, current_user, matches, courses = build_all()

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "roleSkills.json").write_text(json.dumps(roles, indent=2) + "\n")
(OUT / "me.json").write_text(json.dumps(current_user, indent=2) + "\n")
(OUT / "matches.json").write_text(json.dumps(matches, indent=2) + "\n")
(OUT / "courses.json").write_text(json.dumps(courses, indent=2) + "\n")

n_people = sum(len(v) for v in matches.values())
print(f"frontend/data/roleSkills.json: {len(roles)} roles")
print(f"frontend/data/me.json:         {current_user['name']} (hero={HERO_ID})")
print(f"frontend/data/matches.json:    {n_people} matched people across {len(matches)} roles")
print(f"frontend/data/courses.json:    {len(courses)} skills -> courses")
