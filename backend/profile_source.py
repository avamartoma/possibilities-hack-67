"""Resolve demo profiles from the seed catalog or the immutable sample_data source.

The seed catalog (backend/data/users.json) starts at user_5329. The canonical demo
identity used by the frontend hero flow is user_2340 ("Bob Smith"), which only exists
in the larger sample_data/user_data.json. This adapter resolves either source and
normalizes both into the same frontend-ready profile shape, without mutating the raw
source files.
"""

import json
from copy import deepcopy
from functools import lru_cache
from pathlib import Path

from .profiles import normalize_profile

DATA_DIR = Path(__file__).parent / "data"
SAMPLE_USER_DATA = Path(__file__).parent.parent / "sample_data" / "user_data.json"


@lru_cache(maxsize=1)
def _seed_users() -> dict:
    return {user["id"]: user for user in json.loads((DATA_DIR / "users.json").read_text())}


@lru_cache(maxsize=1)
def _sample_users() -> dict:
    # The file is a JSON array that is missing only its opening bracket.
    raw = SAMPLE_USER_DATA.read_text()
    records = json.loads("[" + raw)
    return {record["id"]: record for record in records}


def normalize_sample_user(record: dict) -> dict:
    """Normalize a raw sample_data record into the frontend profile shape.

    Uses deterministic fallback copy whenever the raw source lacks a field.
    """
    experience = [
        {
            "title": item.get("title"),
            "company": item.get("company"),
            "employmentType": item.get("employment_type"),
            "start": item.get("start"),
            "end": item.get("end"),
            "location": item.get("location"),
            "description": item.get("description"),
            "skills": list(item.get("skills", [])),
        }
        for item in record.get("experience", [])
    ]
    education = [
        {
            "school": item.get("school_name"),
            "degree": item.get("degree"),
            "field": item.get("degree"),
            "graduationYear": item.get("graduation_year"),
        }
        for item in record.get("school_history", [])
    ]
    roles = list(record.get("open_to_roles", []))
    if record.get("open_to_work"):
        current_status = "Open to work"
    elif experience and experience[0].get("title"):
        current_status = experience[0]["title"]
    else:
        current_status = "Exploring next career steps"
    return {
        "id": record["id"],
        "name": record.get("name", "Demo user"),
        "headline": record.get("headline") or "Exploring career options",
        "currentStatus": current_status,
        "skills": list(record.get("skills", [])),
        "experience": experience,
        "education": education,
        "interests": roles or list(record.get("skills", []))[:3],
        "savedGoals": [f"Grow toward {role}" for role in roles],
        "location": record.get("current_location"),
    }


def resolve_profile(user_id: str):
    """Return a normalized profile for either source, or None if unknown.

    Seed users keep their existing normalization so Compare/Path behavior is
    unchanged. The returned dict is always a fresh copy; callers may mutate it.
    """
    seed = _seed_users().get(user_id)
    if seed is not None:
        return normalize_profile(seed)
    sample = _sample_users().get(user_id)
    if sample is not None:
        return normalize_sample_user(deepcopy(sample))
    return None
