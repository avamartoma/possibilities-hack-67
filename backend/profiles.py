"""Normalization and request-scoped overrides for seeded demo profiles."""

from copy import deepcopy


def normalize_profile(source: dict) -> dict:
    degree = source.get("degree")
    return {
        "id": source["id"],
        "name": source.get("name", "Demo user"),
        "headline": source.get("tagline") or (f"Exploring careers after studying {degree}" if degree else "Exploring career options"),
        "currentStatus": source.get("currentStatus") or "Exploring next career steps",
        "skills": list(source.get("skills", [])),
        "experience": deepcopy(source.get("experience", [])),
        "education": deepcopy(source.get("education", ([{"field": degree}] if degree else []))),
        "interests": list(source.get("interests", [])),
        "savedGoals": list(source.get("savedGoals", [])),
        "location": source.get("location"),
    }


def apply_override(profile: dict, override) -> dict:
    """Return a profile copy; seeded JSON must never be modified."""
    resolved = deepcopy(profile)
    if not override:
        return resolved
    values = override.model_dump(exclude_none=True) if hasattr(override, "model_dump") else override.dict(exclude_none=True)
    resolved.update(values)
    return resolved
