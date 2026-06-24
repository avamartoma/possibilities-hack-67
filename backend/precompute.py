"""Precompute the Career Map app data FROM the real sample datasets.

Reads the three real files in sample_data/ and emits backend/data/*.json:
  - rolesCatalog.json : one entry per real job position (207 of them), enriched
      with REAL companies, industries, salary range, levels, easy-apply %, a real
      sample description, and real job postings. Skills are assigned
      deterministically from `INDUSTRY_SKILLS` (core) ∪ `KEYWORD_SKILLS`
      (supporting) — jobs_data.json has no skills field, so this hand-authored
      table is the single, testable source of truth for fit. The 10 canonical
      skilled roles keep their curated skill sets and ids.
  - roleSkills.json : the canonical-10 subset (kept for v2 compatibility / legacy
      /api/fit + /api/milestones).
  - users.json : REAL users sampled from user_data.json.
  - courses.json : skill -> [real courses] from course_data.json.

The module exposes importable, unit-tested building blocks (`slugify`,
`INDUSTRY_SKILLS`, `KEYWORD_SKILLS`, `role_skills_for`, `build_catalog`); the
file-writing entry point only runs under `python3 -m backend.precompute`.

Run from repo root:  python3 -m backend.precompute
"""

import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SAMPLE = ROOT / "sample_data"
OUT = Path(__file__).parent / "data"

# ---------------------------------------------------------------------------
# Curated canonical roles. These 10 skilled roles keep their hand-tuned skill
# sets (drawn from the 30-skill user universe) and stable ids, so real users get
# meaningful fits and legacy routes/tests keep resolving.
# ---------------------------------------------------------------------------
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

# ---------------------------------------------------------------------------
# INDUSTRY_SKILLS — every one of the 21 industries in jobs_data.json maps to its
# core skills, drawn from the 30-skill user universe (so real users can reach a
# meaningful, non-zero fit). This is the deterministic source of truth for fit.
# ---------------------------------------------------------------------------
INDUSTRY_SKILLS = {
    "Technology": ["Software", "Computer", "Technology", "AWS", "DevOps"],
    "Engineering": ["Engineering", "Computer", "Technology", "Science"],
    "Aerospace": ["Engineering", "Science", "Technology", "Computer"],
    "Finance": ["Corporate Finance", "Financial Modeling", "Investing", "Economics", "Accounting"],
    "Product Management": ["Business", "Administration", "Data Analysis", "Technology"],
    "Sales & Marketing": ["Marketing", "Business", "Economics", "Administration"],
    "Healthcare": ["Healthcare", "Medicine", "Nursing", "Science"],
    "Biotech & Pharma": ["Science", "Medicine", "Healthcare", "Data Analysis"],
    "Science & Research": ["Science", "Data Analysis", "Machine Learning", "Information"],
    "Education": ["Education", "Teaching", "Psychology", "Administration"],
    "Human Resources": ["Administration", "Business", "Psychology", "Education"],
    "Legal": ["Business", "Administration", "Economics", "Finance"],
    "Design": ["Software", "Computer", "Technology", "Psychology"],
    "Media & Entertainment": ["Marketing", "Technology", "Business", "Information"],
    "Operations & Logistics": ["Business", "Administration", "Data Analysis", "Technology"],
    "Retail & E-commerce": ["Business", "Marketing", "Administration", "Economics"],
    "Customer Success": ["Business", "Administration", "Psychology", "Technology"],
    "Hospitality & Culinary": ["Business", "Administration", "Healthcare", "Education"],
    "Architecture & Construction": ["Engineering", "Technology", "Computer", "Business"],
    "Manufacturing": ["Engineering", "Technology", "Business", "Administration"],
    "Energy & Environment": ["Science", "Engineering", "Technology", "Data Analysis"],
}

ALL_INDUSTRIES = set(INDUSTRY_SKILLS)

# ---------------------------------------------------------------------------
# KEYWORD_SKILLS — position-title keyword → supporting skill. Supplements the
# industry core with title-specific signal (drawn from the same skill universe).
# ---------------------------------------------------------------------------
KEYWORD_SKILLS = {
    "engineer": "Engineering",
    "developer": "Software",
    "software": "Software",
    "data": "Data Analysis",
    "analyst": "Data Analysis",
    "scientist": "Science",
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "ai": "Machine Learning",
    "devops": "DevOps",
    "cloud": "AWS",
    "security": "Information Security",
    "blockchain": "Blockchain",
    "finance": "Corporate Finance",
    "financial": "Financial Modeling",
    "investment": "Investing",
    "account": "Accounting",
    "market": "Marketing",
    "sales": "Business",
    "nurse": "Nursing",
    "clinical": "Nursing",
    "medical": "Medicine",
    "physician": "Medicine",
    "health": "Healthcare",
    "research": "Science",
    "teacher": "Teaching",
    "professor": "Teaching",
    "academic": "Education",
    "hr": "Administration",
    "recruit": "Administration",
    "psycholog": "Psychology",
    "product": "Business",
    "manager": "Administration",
    "designer": "Computer",
    "technolog": "Technology",
}


def slugify(name: str) -> str:
    """Deterministic, collision-free slug for a position name."""
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def role_skills_for(position: str, industry: str) -> tuple[list[str], list[str]]:
    """Return (core, supporting) skills for a derived role.

    Core = the industry's skills. Supporting = title-keyword skills not already
    covered by core. Deterministic and order-stable.
    """
    core = list(INDUSTRY_SKILLS.get(industry, []))
    core_set = {skill.casefold() for skill in core}
    supporting: list[str] = []
    name = position.casefold()
    for keyword, skill in KEYWORD_SKILLS.items():
        if keyword in name and skill.casefold() not in core_set and skill not in supporting:
            supporting.append(skill)
    return core, supporting


def _posting(job: dict) -> dict:
    return {
        "id": job["id"],
        "company": job["company"],
        "location": job["location"],
        "level": job["level"],
        "salaryFrom": int(job["salary_range"]["from"]),
        "salaryTo": int(job["salary_range"]["to"]),
        "easyApply": bool(job.get("easy_apply")),
    }


def build_catalog(jobs: list[dict]) -> dict:
    """Build the full role catalog (one entry per distinct position).

    Aggregates real postings per position, assigns deterministic core/supporting
    skills, and overlays the curated canonical roles (preserving their skills and
    category) so the 10 skilled roles keep their hand-tuned fit story.
    """
    by_pos: dict[str, list[dict]] = defaultdict(list)
    for job in jobs:
        by_pos[job["position"]].append(job)

    catalog: dict[str, dict] = {}
    for position, group in sorted(by_pos.items()):
        industries = sorted({job["industry"] for job in group})
        primary_industry = industries[0]
        core, supporting = role_skills_for(position, primary_industry)
        # Canonical roles keep their curated skills (all core) + category.
        if position in ROLE_SKILLS:
            core, supporting = list(ROLE_SKILLS[position]), []
        rid = slugify(position)
        easy_n = sum(1 for job in group if job.get("easy_apply"))
        catalog[rid] = {
            "id": rid,
            "name": position,
            "category": CATEGORY.get(position, primary_industry),
            "description": group[0]["description"],
            "coreSkills": core,
            "supportingSkills": supporting,
            "skills": core + supporting,
            "companies": sorted({job["company"] for job in group}),
            "industries": industries,
            "levels": sorted({job["level"] for job in group}),
            "salaryFrom": min(int(job["salary_range"]["from"]) for job in group),
            "salaryTo": max(int(job["salary_range"]["to"]) for job in group),
            "easyApplyPct": round(100 * easy_n / len(group)),
            "jobCount": len(group),
            "postings": [_posting(job) for job in group[:5]],
        }
    return catalog


def load_users(raw_text: str) -> list[dict]:
    """Load user_data.json, tolerating the legacy missing-opening-bracket form."""
    raw = raw_text.strip()
    return json.loads(raw if raw.startswith("[") else f"[{raw}")


HERO_ID = "user_5329"
DEMO_USER_IDS = [HERO_ID, "user_5377", "user_8705", "user_9138", "user_4579"]


def canonical_subset(catalog: dict) -> dict:
    """The 10 curated skilled roles, kept for v2 / legacy-route compatibility."""
    return {rid: role for rid, role in catalog.items() if role["name"] in ROLE_SKILLS}


def build_demo_users(users_raw: list[dict]) -> list[dict]:
    """Sample the demo users (real skills, one flagged hero) from user_data.json."""
    users_by_id = {u["id"]: u for u in users_raw}
    demo_users = []
    for uid in DEMO_USER_IDS:
        u = users_by_id.get(uid)
        if not u:
            continue
        degree = u["school_history"][0]["degree"] if u.get("school_history") else None
        demo_users.append({"id": u["id"], "name": u["name"], "degree": degree, "skills": u["skills"], "hero": uid == HERO_ID})
    return demo_users


def build_courses(courses_raw: list[dict]) -> dict:
    """Skill -> up to 3 real courses, from course_data.json."""
    skill_to_courses = defaultdict(list)
    for c in courses_raw:
        for skill in c.get("skills", []):
            skill_to_courses[skill].append({"id": c["id"], "name": c["name"], "length": c.get("length"), "level": c.get("level")})
    return {s: lst[:3] for s, lst in sorted(skill_to_courses.items())}


def build_all(jobs_raw: list[dict], users_raw: list[dict], courses_raw: list[dict]) -> dict:
    """Assemble every output payload from the raw sample data (pure, no I/O)."""
    catalog = build_catalog(jobs_raw)
    return {
        "rolesCatalog.json": catalog,
        "roleSkills.json": canonical_subset(catalog),
        "users.json": build_demo_users(users_raw),
        "courses.json": build_courses(courses_raw),
    }


def main(out_dir: Path = OUT, sample_dir: Path = SAMPLE) -> dict:
    """Build every payload from the real sample data and write it to ``out_dir``."""
    jobs_raw = json.loads((sample_dir / "jobs_data.json").read_text())
    users_raw = load_users((sample_dir / "user_data.json").read_text())
    courses_raw = json.loads((sample_dir / "course_data.json").read_text())

    payloads = build_all(jobs_raw, users_raw, courses_raw)
    out_dir.mkdir(parents=True, exist_ok=True)
    for filename, payload in payloads.items():
        (out_dir / filename).write_text(json.dumps(payload, indent=2) + "\n")
    return payloads


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    written = main()
    for filename, payload in written.items():
        print(f"{filename}: {len(payload)} entries")
