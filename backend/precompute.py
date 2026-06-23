"""Precompute the Comparison Page's app data FROM the real sample datasets.

Reads the three real files in sample_data/ and emits backend/data/*.json:
  - roleSkills.json : one entry per real job position, enriched with REAL
      companies, industries, salary range, levels, easy-apply %, a real sample
      description, and a few real job postings (id/company/location/salary/easy).
      The `skills` list is the ONLY hand-authored part — jobs_data.json has no
      skills field, and aggregating skills of users who hold each role is noise
      (verified: the data is randomly generated), so role->skills is curated.
  - users.json : REAL users sampled from user_data.json (id, name, degree from
      school_history, real skills), with one flagged as the demo "hero".
  - courses.json : skill -> [real courses] from course_data.json, so the gap /
      Milestone page can recommend real courses for missing skills.

Run from repo root:  python3 backend/precompute.py
"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "sample_data"
OUT = Path(__file__).parent / "data"

users_raw = json.loads((SAMPLE / "user_data.json").read_text())
jobs_raw = json.loads((SAMPLE / "jobs_data.json").read_text())
courses_raw = json.loads((SAMPLE / "course_data.json").read_text())

# ---------------------------------------------------------------------------
# 1. Curated role -> skills. The ONLY hand-authored data (see module docstring).
#    Skills are chosen to intersect the real user + course skill vocabularies so
#    real users get sensible fits and missing skills map to real courses.
# ---------------------------------------------------------------------------
ROLE_SKILLS = {
    "Software Engineer": ["Python", "AWS", "DevOps", "Software", "Engineering", "Data Analysis"],
    "DevOps Engineer": ["AWS", "DevOps", "Blockchain", "Network Security", "Python", "Information Security"],
    "Data Scientist": ["Python", "Machine Learning", "Data Analysis", "AWS", "Economics", "Investing"],
    "UX Designer": ["UX/UI", "Graphic Design", "Photoshop", "Communication", "Content Creation", "Creative Writing"],
    "Product Manager": ["Agile", "Scrum", "Project Planning", "Strategic Planning", "Communication", "Data Analysis"],
    "Financial Analyst": ["Financial Modeling", "Corporate Finance", "Investing", "Economics", "Excel", "Accounting"],
    "Marketing Specialist": ["Marketing Strategies", "SEO", "Content Creation", "Communication", "Strategic Planning", "Marketing"],
    "HR Coordinator": ["Recruiting", "HR Policies", "Employee Relations", "Communication", "Negotiation", "Administration"],
    "Sales Representative": ["Negotiation", "Communication", "Public Speaking", "Strategic Planning", "Business", "Marketing"],
    "Customer Service Manager": ["Communication", "Employee Relations", "Negotiation", "Project Planning", "Administration", "Business"],
}

CATEGORY = {
    "Software Engineer": "Technology", "DevOps Engineer": "Technology", "Data Scientist": "Technology",
    "UX Designer": "Design", "Product Manager": "Business", "Financial Analyst": "Finance",
    "Marketing Specialist": "Business", "HR Coordinator": "Business",
    "Sales Representative": "Business", "Customer Service Manager": "Business",
}


def role_id(position: str) -> str:
    return position.lower().replace(" ", "_")


# ---------------------------------------------------------------------------
# 2. Roles enriched from REAL jobs_data.json.
# ---------------------------------------------------------------------------
by_pos = defaultdict(list)
for j in jobs_raw:
    by_pos[j["position"]].append(j)

roles = {}
for position, jobs in by_pos.items():
    companies = sorted({j["company"] for j in jobs})
    industries = sorted({j["industry"] for j in jobs})
    levels = sorted({j["level"] for j in jobs})
    sal_lo = min(int(j["salary_range"]["from"]) for j in jobs)
    sal_hi = max(int(j["salary_range"]["to"]) for j in jobs)
    easy_n = sum(1 for j in jobs if j.get("easy_apply"))
    # a few REAL postings to show as job cards
    postings = [
        {
            "id": j["id"],
            "company": j["company"],
            "location": j["location"],
            "level": j["level"],
            "salaryFrom": int(j["salary_range"]["from"]),
            "salaryTo": int(j["salary_range"]["to"]),
            "easyApply": bool(j.get("easy_apply")),
        }
        for j in jobs[:5]
    ]
    rid = role_id(position)
    roles[rid] = {
        "id": rid,
        "name": position,
        "category": CATEGORY.get(position, "Other"),
        "description": jobs[0]["description"],  # REAL templated description
        "skills": ROLE_SKILLS.get(position, []),  # curated (see docstring)
        "companies": companies,                   # REAL
        "industries": industries,                 # REAL
        "levels": levels,                          # REAL
        "salaryFrom": sal_lo,                      # REAL
        "salaryTo": sal_hi,                        # REAL
        "easyApplyPct": round(100 * easy_n / len(jobs)),  # REAL
        "jobCount": len(jobs),                     # REAL
        "postings": postings,                      # REAL job rows
    }

# ---------------------------------------------------------------------------
# 3. Demo users sampled from REAL user_data.json.
#    Pick users with >=3 real skills so fits aren't trivially 0; flag a hero
#    whose skills tell a "closer than you think" story.
# ---------------------------------------------------------------------------
HERO_ID = "user_5329"  # Economics grad whose security skills transfer to DevOps
WANT = [HERO_ID, "user_5377", "user_8705", "user_9138", "user_4579"]
users_by_id = {u["id"]: u for u in users_raw}

demo_users = []
for uid in WANT:
    u = users_by_id.get(uid)
    if not u:
        continue
    degree = u["school_history"][0]["degree"] if u.get("school_history") else None
    demo_users.append({
        "id": u["id"],
        "name": u["name"],          # REAL
        "degree": degree,            # REAL (from school_history)
        "skills": u["skills"],       # REAL
        "hero": uid == HERO_ID,
    })

# ---------------------------------------------------------------------------
# 4. Skill -> real courses, from REAL course_data.json (for gap / Milestone).
# ---------------------------------------------------------------------------
skill_to_courses = defaultdict(list)
for c in courses_raw:
    for skill in c.get("skills", []):
        skill_to_courses[skill].append({
            "id": c["id"],
            "name": c["name"],
            "length": c.get("length"),
            "level": c.get("level"),
        })
# keep at most 3 courses per skill for a tidy payload
courses_by_skill = {s: lst[:3] for s, lst in sorted(skill_to_courses.items())}

# ---------------------------------------------------------------------------
# Write outputs.
# ---------------------------------------------------------------------------
OUT.mkdir(exist_ok=True)
(OUT / "roleSkills.json").write_text(json.dumps(roles, indent=2) + "\n")
(OUT / "users.json").write_text(json.dumps(demo_users, indent=2) + "\n")
(OUT / "courses.json").write_text(json.dumps(courses_by_skill, indent=2) + "\n")

print(f"roleSkills.json: {len(roles)} roles enriched from {len(jobs_raw)} real jobs")
print(f"users.json:      {len(demo_users)} real users (hero={HERO_ID})")
print(f"courses.json:    {len(courses_by_skill)} skills -> real courses from {len(courses_raw)} courses")
