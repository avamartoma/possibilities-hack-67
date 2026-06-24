"""Top-applicant job ranking.

Ranks the real postings in the catalog by how well a profile fits the posting's
role: the role's weighted readiness, plus a small alignment bonus for entry/mid
levels (more attainable) and for industries the profile already has signal in.
Deterministic; no peer data.
"""

from .readiness import _fold_set, compute_readiness

TOP_APPLICANT_THRESHOLD = 70

# Lower-seniority postings are more attainable → a small, bounded level bonus.
_LEVEL_BONUS = {"Entry": 6, "Mid": 4, "Senior": 0, "Management": 0}


def _industry_bonus(profile_skills, role: dict) -> int:
    """Small bonus when the profile already holds one of the role's core skills."""
    user = _fold_set(profile_skills)
    core = _fold_set(role.get("coreSkills", role.get("skills", [])))
    return 4 if user & core else 0


def rank_top_applicant_jobs(profile: dict, roles: dict, limit: int = 25) -> list[dict]:
    """Return real postings ranked by descending fit for the profile."""
    skills = profile["skills"]
    scored: list[dict] = []
    for rid, role in roles.items():
        readiness = compute_readiness(skills, role)
        industry_bonus = _industry_bonus(skills, role)
        for posting in role.get("postings", []):
            score = min(100, readiness + industry_bonus + _LEVEL_BONUS.get(posting["level"], 0))
            scored.append({
                **posting,
                "roleId": rid,
                "score": score,
                "topApplicant": score >= TOP_APPLICANT_THRESHOLD,
            })
    # Deterministic order: score desc, then posting id for stable tie-breaking.
    scored.sort(key=lambda job: (-job["score"], job["id"]))
    return scored[:limit]
