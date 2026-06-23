"""Build the Comparison Page's app data FROM the real sample datasets.

Single source of truth for turning the three real files in `sample_data/`
(user_data.json, jobs_data.json, course_data.json) into the shapes the app
serves. Used directly by main.py at startup (no pre-generated files) and by
precompute.py to emit the frontend's offline-fallback JSON.

Everything here is REAL data from the files, EXCEPT each role's `skills` list:
jobs_data.json has no skills field, and aggregating the skills of users who hold
each role is noise (the sample data is randomly generated — verified), so
role->skills is curated. Every curated skill is drawn from the 30 skills that
actually appear in user_data.json, so real users reach non-zero fit on every role.
"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "sample_data"

# --- Curated role -> skills (the ONLY hand-authored data; see module docstring) ---
ROLE_SKILLS = {
    "Software Engineer": ["Python", "AWS", "DevOps", "Software", "Engineering", "Computer"],
    "DevOps Engineer": ["AWS", "DevOps", "Blockchain", "Network Security", "Python", "Information Security"],
    "Data Scientist": ["Python", "Machine Learning", "Data Analysis", "AWS", "Science", "Information"],
    "UX Designer": ["Software", "Computer", "Technology", "Information", "Psychology", "Engineering"],
    "Product Manager": ["Business", "Administration", "Data Analysis", "Marketing", "Technology", "Economics"],
    "Financial Analyst": ["Financial Modeling", "Corporate Finance", "Investing", "Economics", "Accounting", "Finance"],
    "Marketing Specialist": ["Marketing", "Business", "Economics", "Administration", "Data Analysis", "Technology"],
    "HR Coordinator": ["Administration", "Business", "Psychology", "Education", "Teaching", "Information"],
    "Sales Representative": ["Business", "Marketing", "Economics", "Finance", "Administration", "Investing"],
    "Customer Service Manager": ["Business", "Administration", "Healthcare", "Education", "Psychology", "Technology"],
}

CATEGORY = {
    "Software Engineer": "Technology", "DevOps Engineer": "Technology", "Data Scientist": "Technology",
    "UX Designer": "Design", "Product Manager": "Business", "Financial Analyst": "Finance",
    "Marketing Specialist": "Business", "HR Coordinator": "Business",
    "Sales Representative": "Business", "Customer Service Manager": "Business",
}

# Demo users sampled from the real dataset; first is the "hero".
HERO_ID = "user_5329"  # Economics grad whose security skills transfer to DevOps
DEMO_USER_IDS = [HERO_ID, "user_5377", "user_8705", "user_9138", "user_4579"]


def role_id(position):
    return position.lower().replace(" ", "_")


def load_sample():
    """Read the three real datasets from sample_data/."""
    users = json.loads((SAMPLE / "user_data.json").read_text())
    jobs = json.loads((SAMPLE / "jobs_data.json").read_text())
    courses = json.loads((SAMPLE / "course_data.json").read_text())
    return users, jobs, courses


def build_roles(jobs_raw):
    """One role per real job position, enriched with REAL fields from jobs_data."""
    by_pos = defaultdict(list)
    for j in jobs_raw:
        by_pos[j["position"]].append(j)

    roles = {}
    for position, jobs in by_pos.items():
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
            "description": jobs[0]["description"],            # REAL
            "skills": ROLE_SKILLS.get(position, []),          # curated
            "companies": sorted({j["company"] for j in jobs}),      # REAL
            "industries": sorted({j["industry"] for j in jobs}),    # REAL
            "levels": sorted({j["level"] for j in jobs}),           # REAL
            "salaryFrom": min(int(j["salary_range"]["from"]) for j in jobs),  # REAL
            "salaryTo": max(int(j["salary_range"]["to"]) for j in jobs),      # REAL
            "easyApplyPct": round(100 * sum(1 for j in jobs if j.get("easy_apply")) / len(jobs)),  # REAL
            "jobCount": len(jobs),                            # REAL
            "postings": postings,                             # REAL
        }
    return roles


def build_users(users_raw):
    """Demo users sampled from REAL user_data.json (real name/degree/skills)."""
    by_id = {u["id"]: u for u in users_raw}
    out = []
    for uid in DEMO_USER_IDS:
        u = by_id.get(uid)
        if not u:
            continue
        degree = u["school_history"][0]["degree"] if u.get("school_history") else None
        out.append({
            "id": u["id"],
            "name": u["name"],
            "degree": degree,
            "skills": u["skills"],
            "hero": uid == HERO_ID,
        })
    return out


def build_courses(courses_raw):
    """Skill -> up to 3 REAL courses from course_data.json (for the Milestone page)."""
    skill_to_courses = defaultdict(list)
    for c in courses_raw:
        for skill in c.get("skills", []):
            skill_to_courses[skill].append({
                "id": c["id"],
                "name": c["name"],
                "length": c.get("length"),
                "level": c.get("level"),
            })
    return {s: lst[:3] for s, lst in sorted(skill_to_courses.items())}


def build_all():
    """Build (roles, users, courses) from sample_data/."""
    users_raw, jobs_raw, courses_raw = load_sample()
    return build_roles(jobs_raw), build_users(users_raw), build_courses(courses_raw)
