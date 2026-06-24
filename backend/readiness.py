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


def _evidence_skills(profile: dict, matched_required: dict[str, str]) -> set[str]:
    """Return canonical matched skills backed by structured profile history."""
    evidence = set()
    for item in profile.get("experience", []):
        listed = _fold_set(item.get("skills", []))
        text = " ".join(str(item.get(key, "")) for key in ("title", "description")).casefold()
        for folded, original in matched_required.items():
            if folded in listed or original.casefold() in text:
                evidence.add(folded)
    for item in profile.get("education", []):
        text = " ".join(str(item.get(key, "")) for key in ("degree", "field")).casefold()
        for folded, original in matched_required.items():
            if original.casefold() in text:
                evidence.add(folded)
    return evidence


def compute_profile_readiness(profile: dict, role: dict) -> tuple[int, dict]:
    """Return the explainable 100-point readiness score and its contributions.

    A profile receives 65 points for core-role skill coverage, 20 for supporting
    skill coverage, and 15 for showing matched skills in experience or education.
    Roles without supporting skills use an 81/19 core/evidence split instead.
    """
    core = list(role.get("coreSkills", role.get("skills", [])))
    supporting = list(role.get("supportingSkills", []))
    core_set, sup_set = _fold_set(core), _fold_set(supporting)
    required = core_set | sup_set
    if not required:
        empty = {"core": {"matched": 0, "total": 0, "points": 0}, "supporting": {"matched": 0, "total": 0, "points": 0}, "evidence": {"matched": 0, "total": 0, "points": 0}}
        return 0, empty

    user = _fold_set(profile.get("skills", []))
    matched_core, matched_supporting = core_set & user, sup_set & user
    matched_required = {folded: skill for skill in [*core, *supporting] for folded in [_fold(skill)] if folded in user}
    evidenced = _evidence_skills(profile, matched_required)
    if sup_set:
        core_weight, supporting_weight, evidence_weight = 65, 20, 15
    elif core_set:
        core_weight, supporting_weight, evidence_weight = 81, 0, 19
    else:
        core_weight, supporting_weight, evidence_weight = 0, 81, 19
    core_points = round(core_weight * len(matched_core) / len(core_set)) if core_set else 0
    supporting_points = round(supporting_weight * len(matched_supporting) / len(sup_set)) if sup_set else 0
    evidence_points = round(evidence_weight * len(evidenced) / len(required))
    score = max(0, min(100, core_points + supporting_points + evidence_points))
    breakdown = {
        "core": {"matched": len(matched_core), "total": len(core_set), "points": core_points},
        "supporting": {"matched": len(matched_supporting), "total": len(sup_set), "points": supporting_points},
        "evidence": {"matched": len(evidenced), "total": len(required), "points": evidence_points},
    }
    return score, breakdown
