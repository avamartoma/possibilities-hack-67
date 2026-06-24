"""Canonical role catalog, role search, and deterministic explanations."""

from copy import deepcopy


RELATED = {
    "data_scientist": ["software_engineer", "product_manager", "financial_analyst"],
    "software_engineer": ["devops_engineer", "data_scientist", "ux_designer"],
    "devops_engineer": ["software_engineer", "data_scientist"],
    "product_manager": ["marketing_specialist", "data_scientist", "ux_designer"],
    "ux_designer": ["product_manager", "software_engineer"],
    "financial_analyst": ["data_scientist", "sales_representative"],
    "marketing_specialist": ["product_manager", "sales_representative"],
    "sales_representative": ["marketing_specialist", "financial_analyst"],
    "hr_coordinator": ["customer_service_manager", "marketing_specialist"],
    "customer_service_manager": ["hr_coordinator", "sales_representative"],
}


def _metadata(role: dict) -> tuple[list[str], list[str]]:
    skills = role.get("skills", [])
    day_to_day = [
        f"Use {skills[0]} to move work forward" if skills else "Coordinate work with your team",
        f"Partner across teams and communicate tradeoffs using {skills[1]}" if len(skills) > 1 else "Share clear updates with stakeholders",
        "Turn a real business or customer problem into a practical next step",
    ]
    paths = [
        f"Build foundational {skills[0]} evidence through coursework or a project" if skills else "Build a portfolio project",
        "Use an entry-level role, internship, or adjacent project to gain context",
        f"Grow into a {role['name']} role with a portfolio that shows outcomes",
    ]
    return day_to_day, paths


def normalize_role(role: dict) -> dict:
    day_to_day, paths = _metadata(role)
    return {
        "id": role["id"], "name": role["name"], "category": role.get("category", "Other"),
        "summary": role.get("description", ""), "description": role.get("description", ""),
        "requiredSkills": list(role.get("skills", [])),
        "coreSkills": list(role.get("coreSkills", role.get("skills", []))),
        "supportingSkills": list(role.get("supportingSkills", [])),
        "relatedRoleIds": RELATED.get(role["id"], []),
        "dayToDay": day_to_day, "commonPaths": paths,
        "salaryRange": {"min": role.get("salaryFrom"), "max": role.get("salaryTo"), "currency": "USD", "isDemoGuidance": True},
        "companies": list(role.get("companies", [])), "postings": deepcopy(role.get("postings", [])),
        "jobCount": role.get("jobCount", 0), "industries": list(role.get("industries", [])),
        "levels": list(role.get("levels", [])),
    }


def role_summary(role: dict) -> dict:
    full = normalize_role(role)
    return {key: full[key] for key in ("id", "name", "category", "summary", "requiredSkills", "companies", "jobCount", "industries", "levels", "salaryRange")}


def search_roles(roles: dict, query: str = "", categories=None, skills=None, limit: int = 20) -> list:
    terms = [term.casefold() for term in query.split() if term.strip()]
    wanted_categories = {item.casefold() for item in (categories or [])}
    wanted_skills = {item.casefold() for item in (skills or [])}
    results = []
    for role in roles.values():
        if wanted_categories and role.get("category", "").casefold() not in wanted_categories:
            continue
        role_skills = {item.casefold() for item in role.get("skills", [])}
        if wanted_skills and not wanted_skills.intersection(role_skills):
            continue
        haystack = " ".join([role.get("name", ""), role.get("category", ""), role.get("description", ""), *role.get("skills", []), *role.get("industries", []), *role.get("companies", [])]).casefold()
        relevance = sum(term in haystack for term in terms)
        if terms and relevance == 0:
            continue
        results.append((relevance, role.get("jobCount", 0), role))
    results.sort(key=lambda item: (-item[0], -item[1], item[2]["name"]))
    return [role_summary(item[2]) for item in results[:limit]]


def explain_role(role: dict, profile, roles: dict) -> dict:
    normalized = normalize_role(role)
    related = [role_summary(roles[role_id]) for role_id in normalized["relatedRoleIds"] if role_id in roles]
    strengths = []
    if profile:
        user_skills = {skill.casefold() for skill in profile["skills"]}
        strengths = [skill for skill in normalized["requiredSkills"] if skill.casefold() in user_skills]
    if strengths:
        why = f"You already have signal in {', '.join(strengths[:3])}. That gives you a concrete place to start; build proof around the remaining core skills."
    elif profile:
        why = f"This is a stretch right now, but your profile can become relevant by building evidence in {', '.join(normalized['requiredSkills'][:2])}."
    else:
        why = f"A good fit if you enjoy solving practical problems and want to build evidence in {', '.join(normalized['requiredSkills'][:2])}."
    return {"role": normalized, "plainLanguageSummary": f"{role['name']} is about turning {normalized['requiredSkills'][0] if normalized['requiredSkills'] else 'your skills'} into useful outcomes. {normalized['summary']}", "dayToDay": normalized["dayToDay"], "coreSkills": normalized["requiredSkills"], "commonPaths": normalized["commonPaths"], "relatedRoles": related, "salaryRange": normalized["salaryRange"], "whyItMayFit": why, "disclaimer": "Demo guidance based on seeded job data; it is not a career guarantee."}
