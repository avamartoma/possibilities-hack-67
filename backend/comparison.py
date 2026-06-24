"""Deterministic recommendation and comparison services."""

from .analysis import aggregate_role_analysis
from .readiness import compute_readiness
from .roles import RELATED, normalize_role


def _casefold(values):
    return {value.casefold() for value in values}


def compare_profile_to_role(profile: dict, role: dict) -> dict:
    normalized_role = normalize_role(role)
    user_skills = _casefold(profile["skills"])
    required = normalized_role["requiredSkills"]
    strengths = [skill for skill in required if skill.casefold() in user_skills]
    missing = [skill for skill in required if skill.casefold() not in user_skills]
    readiness = compute_readiness(profile["skills"], normalized_role)
    gaps = [{"skill": skill, "status": "missing", "importance": "core", "evidence": [], "recommendedCourse": None, "suggestedProject": f"Create a small portfolio project that uses {skill}."} for skill in missing]
    gaps.extend({"skill": skill, "status": "strength", "importance": "core", "evidence": ["Listed in your profile"], "recommendedCourse": None, "suggestedProject": None} for skill in strengths)
    return {"profile": profile, "role": normalized_role, "readinessScore": readiness, "strengths": strengths, "skillGaps": gaps, "suggestedNextSteps": [f"Build evidence in {skill}" for skill in missing[:3]] or ["Turn your current strengths into a portfolio story."], "aggregateAnalysis": aggregate_role_analysis(role["name"], profile["skills"])}


def recommend_roles(profile: dict, roles: dict, interests: list[str], query: str, limit: int) -> list[dict]:
    user_skills = _casefold(profile["skills"])
    terms = _casefold([*profile.get("interests", []), *interests, *query.split()])
    query_text = " ".join([query, *interests]).casefold()
    # Industry is the primary prompt signal. These aliases cover common language
    # that is broader than the catalog's exact jobs_data.json labels.
    aliases = {
        "healthcare": ("health", "medical", "medicine", "hospital", "clinical", "patient", "nursing"),
        "biotech & pharma": ("biotech", "pharma", "pharmaceutical", "drug", "biology", "life science"),
        "media & entertainment": ("broadcast", "broadcasting", "media", "journalism", "film", "tv", "television", "radio", "music"),
        "education": ("education", "teaching", "teacher", "school", "learning"),
    }
    matched_industries = {
        industry.casefold()
        for role in roles.values()
        for industry in role.get("industries", [])
        if industry.casefold() in query_text or any(alias in query_text for alias in aliases.get(industry.casefold(), ()))
    }
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
        role_industries = _casefold(role.get("industries", []))
        industry_match = bool(role_industries & matched_industries)
        relevance = sum(term in text for term in terms)
        adjacent_boost = 2 if role["id"] in adjacent_ids and not overlap else 0
        score = (10000 if industry_match else 0) + len(overlap) * 10 + relevance * 4 + adjacent_boost + min(role.get("jobCount", 0), 200) / 100
        reasons = []
        if industry_match: reasons.append(f"Matches the {role.get('industries', [''])[0]} industry")
        if overlap: reasons.append(f"Matches {', '.join(overlap[:3])}")
        if relevance: reasons.append("Connects with your interests or search")
        if adjacent_boost: reasons.append("Adjacent to roles that match your current skills")
        if role.get("jobCount", 0): reasons.append(f"Backed by {role['jobCount']} seeded postings")
        ranked.append((score, role.get("jobCount", 0), role, overlap, reasons or ["An adjacent role to explore"]))
    ranked.sort(key=lambda item: (-item[0], -item[1], item[2]["name"]))
    results = []
    for score, _, role, overlap, reasons in ranked[:limit]:
        normalized = normalize_role(role)
        readiness = compute_readiness(profile["skills"], normalized)
        results.append({"role": normalized, "score": round(score, 2), "readinessScore": readiness, "scoreReasons": reasons, "matchedSkills": overlap})
    return results


def recommend_exploratory_roles(profile: dict, roles: dict, limit: int) -> list[dict]:
    user_skills = _casefold(profile["skills"])
    high_fit = {rid for rid, role in roles.items() if compute_readiness(profile["skills"], normalize_role(role)) >= 50}
    adjacent = {target for rid in high_fit for target in RELATED.get(rid, [])}
    ranked = []
    for role in roles.values():
        normalized = normalize_role(role)
        readiness = compute_readiness(profile["skills"], normalized)
        if readiness >= 65:
            continue
        industry = (normalized.get("industries") or [normalized["category"]])[0]
        novel = not user_skills.intersection(_casefold(normalized.get("coreSkills", [])))
        score = 100 - abs(readiness - 30) + (20 if novel else 0) + (10 if role["id"] in adjacent else 0)
        if novel:
            reason = f"New industry: {industry}"
        elif role["id"] in adjacent:
            reason = "Adjacent to your current strengths"
        else:
            reason = f"Stretch: {readiness}% readiness"
        ranked.append((score, role["name"], normalized, readiness, reason))
    ranked.sort(key=lambda row: (-row[0], row[1]))
    return [{"role": role, "readinessScore": readiness, "exploreReason": reason} for _, _, role, readiness, reason in ranked[:limit]]
