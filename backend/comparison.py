"""Deterministic recommendation and comparison services."""

from .analysis import aggregate_role_analysis
from .roles import RELATED, normalize_role


def _casefold(values):
    return {value.casefold() for value in values}


def compare_profile_to_role(profile: dict, role: dict) -> dict:
    normalized_role = normalize_role(role)
    user_skills = _casefold(profile["skills"])
    required = normalized_role["requiredSkills"]
    strengths = [skill for skill in required if skill.casefold() in user_skills]
    missing = [skill for skill in required if skill.casefold() not in user_skills]
    readiness = round(100 * len(strengths) / len(required)) if required else 0
    gaps = [{"skill": skill, "status": "missing", "importance": "core", "evidence": [], "recommendedCourse": None, "suggestedProject": f"Create a small portfolio project that uses {skill}."} for skill in missing]
    gaps.extend({"skill": skill, "status": "strength", "importance": "core", "evidence": ["Listed in your profile"], "recommendedCourse": None, "suggestedProject": None} for skill in strengths)
    return {"profile": profile, "role": normalized_role, "readinessScore": readiness, "strengths": strengths, "skillGaps": gaps, "suggestedNextSteps": [f"Build evidence in {skill}" for skill in missing[:3]] or ["Turn your current strengths into a portfolio story."], "aggregateAnalysis": aggregate_role_analysis(role["name"], profile["skills"])}


def recommend_roles(profile: dict, roles: dict, interests: list[str], query: str, limit: int) -> list[dict]:
    user_skills = _casefold(profile["skills"])
    terms = _casefold([*profile.get("interests", []), *interests, *query.split()])
    direct_match_ids = {
        role_id for role_id, role in roles.items()
        if user_skills.intersection(_casefold(role.get("skills", [])))
    }
    adjacent_ids = {related_id for role_id in direct_match_ids for related_id in RELATED.get(role_id, [])}
    ranked = []
    for role in roles.values():
        required = role.get("skills", [])
        overlap = [skill for skill in required if skill.casefold() in user_skills]
        text = " ".join([role["name"], role.get("category", ""), role.get("description", ""), *required, *role.get("industries", [])]).casefold()
        relevance = sum(term in text for term in terms)
        adjacent_boost = 2 if role["id"] in adjacent_ids and not overlap else 0
        score = len(overlap) * 10 + relevance * 4 + adjacent_boost + min(role.get("jobCount", 0), 200) / 100
        reasons = []
        if overlap: reasons.append(f"Matches {', '.join(overlap[:3])}")
        if relevance: reasons.append("Connects with your interests or search")
        if adjacent_boost: reasons.append("Adjacent to roles that match your current skills")
        if role.get("jobCount", 0): reasons.append(f"Backed by {role['jobCount']} seeded postings")
        ranked.append((score, role.get("jobCount", 0), role, overlap, reasons or ["An adjacent role to explore"]))
    ranked.sort(key=lambda item: (-item[0], -item[1], item[2]["name"]))
    results = []
    for score, _, role, overlap, reasons in ranked[:limit]:
        required = role.get("skills", [])
        readiness = round(100 * len(overlap) / len(required)) if required else 0
        results.append({"role": normalize_role(role), "score": round(score, 2), "readinessScore": readiness, "scoreReasons": reasons, "matchedSkills": overlap})
    return results
