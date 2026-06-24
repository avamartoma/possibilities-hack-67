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

# The logged-in profile ("you") = this real user from user_data.json.
HERO_ID = "user_5329"  # Economics grad whose security skills transfer to DevOps
# Display name override for "you" (the dataset name is a placeholder).
HERO_NAME = "Daniel Lee"


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


def _shape_user(u):
    degree = u["school_history"][0]["degree"] if u.get("school_history") else None
    return {
        "id": u["id"],
        "name": u["name"],
        "degree": degree,
        "skills": u.get("skills", []),
    }


def build_current_user(users_raw):
    """The single logged-in profile ("you") — the hero from user_data.json,
    with the display name overridden to HERO_NAME (real degree/skills kept)."""
    hero = next((u for u in users_raw if u["id"] == HERO_ID), users_raw[0])
    shaped = _shape_user(hero)
    shaped["name"] = HERO_NAME
    return shaped


def build_analysis(users_raw, jobs_raw, current_user):
    """For each role, INVISIBLE aggregate analysis of people who landed it.

    We never expose individual profiles — only counts, so the screen can say
    e.g. "2,000 profiles analyzed · 383 landed this role · 111 share your
    skills". "Landed it" = the user's job_history contains that position.

    Returns { roleId: {analyzed, landed, similar, topMissing} } where topMissing
    is the skills most commonly held by role-landers that you don't have yet
    (this is what feeds the Milestone page's recommendations).
    """
    job_position = {j["id"]: j["position"] for j in jobs_raw}
    my_skills = set(current_user["skills"])
    analyzed = len(users_raw)

    landed = defaultdict(int)
    similar = defaultdict(int)
    missing_counts = defaultdict(lambda: defaultdict(int))  # role -> skill -> count
    for u in users_raw:
        if u["id"] == current_user["id"]:
            continue
        positions = {job_position.get(jid) for jid in u.get("job_history", [])}
        u_skills = set(u.get("skills", []))
        for position in positions:
            if not position:
                continue
            rid = role_id(position)
            landed[rid] += 1
            if u_skills & my_skills:
                similar[rid] += 1
            for s in u_skills - my_skills:
                missing_counts[rid][s] += 1

    analysis = {}
    for rid in landed:
        # sort by count desc, then skill name asc for a stable, reproducible order
        top_missing = sorted(missing_counts[rid].items(), key=lambda kv: (-kv[1], kv[0]))[:5]
        analysis[rid] = {
            "analyzed": analyzed,
            "landed": landed[rid],
            "similar": similar[rid],
            "topMissing": [s for s, _ in top_missing],
        }
    return analysis


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
    """Build (roles, current_user, analysis, courses) from sample_data/.

    - roles: role catalog enriched from jobs_data.json
    - current_user: the single logged-in profile ("you")
    - analysis: roleId -> invisible aggregate stats over people who landed it
      (counts only; no individual profiles exposed)
    - courses: skill -> real courses
    """
    users_raw, jobs_raw, courses_raw = load_sample()
    roles = build_roles(jobs_raw)
    current_user = build_current_user(users_raw)
    analysis = build_analysis(users_raw, jobs_raw, current_user)
    courses = build_courses(courses_raw)
    return roles, current_user, analysis, courses
