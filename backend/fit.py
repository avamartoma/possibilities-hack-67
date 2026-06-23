"""Fit math for the Comparison Page.

Pure function, no I/O — easy to unit test. The fit is a flat skill-overlap:
percent = |userSkills ∩ roleSkills| / |roleSkills|.

The frontend (lib/fit.ts) mirrors compute_fit exactly so the demo renders the
same numbers even when this backend isn't running.
"""


def compute_fit(user_skills, role):
    """Flat skill-overlap fit between a user and a role.

    Skill matching is case-insensitive and order-independent. Returns the
    rounded percent plus the have/missing skill lists (preserving the role's
    canonical skill spelling), sorted for stable display.

    Returns a dict: {role, percent, haveSkills, missingSkills}.
    """
    role_skills = role.get("skills", [])
    user_set = {s.casefold() for s in user_skills}

    have = sorted(s for s in role_skills if s.casefold() in user_set)
    missing = sorted(s for s in role_skills if s.casefold() not in user_set)

    percent = round(100 * len(have) / len(role_skills)) if role_skills else 0

    return {
        "role": {
            "id": role["id"],
            "name": role["name"],
            "description": role["description"],
            "companies": role.get("companies", []),
        },
        "percent": percent,
        "haveSkills": have,
        "missingSkills": missing,
    }
