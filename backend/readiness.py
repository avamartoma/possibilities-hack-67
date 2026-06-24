"""Honest, weighted readiness scoring.

Replaces the raw `matched/required` ratio with a deterministic model that weights
core skills above supporting ones, folds case/whitespace/synonyms, ignores the
supporting term when a role has none (no free penalty), and clamps to [0, 100].
The result is monotonic: adding a matching skill never lowers the score.
"""

W_CORE = 0.7
W_SUP = 0.3

# Small synonym map → canonical skill from the 30-skill user universe.
SKILL_SYNONYMS = {
    "comp sci": "Computer",
    "computer science": "Computer",
    "cs": "Computer",
    "ml": "Machine Learning",
    "machine-learning": "Machine Learning",
    "ai": "Machine Learning",
    "artificial intelligence": "Machine Learning",
    "dev ops": "DevOps",
    "amazon web services": "AWS",
    "infosec": "Information Security",
    "cybersecurity": "Information Security",
    "fin modeling": "Financial Modeling",
}


def _fold(skill: str) -> str:
    normalized = " ".join(skill.split()).casefold()
    return SKILL_SYNONYMS.get(normalized, skill).casefold() if normalized in SKILL_SYNONYMS else normalized


def _fold_set(skills) -> set:
    return {_fold(skill) for skill in skills}


def compute_readiness(profile_skills, role: dict) -> int:
    """Weighted readiness in [0, 100] for a profile against a role.

    Core skills (the role's `coreSkills`, or `skills` for untagged legacy roles)
    are weighted above `supportingSkills`. A role with no supporting skills is
    scored on core alone (the supporting weight drops out of the denominator).
    """
    user = _fold_set(profile_skills)
    core = list(role.get("coreSkills", role.get("skills", [])))
    supporting = list(role.get("supportingSkills", []))

    if not core and not supporting:
        return 0

    core_set = _fold_set(core)
    sup_set = _fold_set(supporting)

    core_hit = len(core_set & user) / len(core_set) if core_set else 0.0
    sup_hit = len(sup_set & user) / len(sup_set) if sup_set else 0.0

    # At least one of core/supporting is non-empty here (the empty case returned
    # above), so total_weight is always > 0.
    weight_core = W_CORE if core_set else 0.0
    weight_sup = W_SUP if sup_set else 0.0
    total_weight = weight_core + weight_sup

    readiness = 100 * (weight_core * core_hit + weight_sup * sup_hit) / total_weight
    return max(0, min(100, round(readiness)))
