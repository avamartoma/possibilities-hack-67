"""Aggregate career-path analysis without exposing individual profile records."""

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SAMPLE_DIR = ROOT / "sample_data"
SAMPLE_USERS = json.loads((SAMPLE_DIR / "user_data.json").read_text())
SAMPLE_JOBS = json.loads((SAMPLE_DIR / "jobs_data.json").read_text())
JOB_POSITIONS = {job["id"]: job["position"] for job in SAMPLE_JOBS}


def aggregate_role_analysis(role_name, profile_skills):
    """Return counts for role holders with adjacent starting skills."""
    profile_set = {skill.casefold() for skill in profile_skills}
    landed = []

    for user in SAMPLE_USERS:
        positions = {JOB_POSITIONS.get(job_id) for job_id in user.get("job_history", [])}
        if role_name in positions:
            landed.append(user)

    similar = sum(
        bool(profile_set & {skill.casefold() for skill in user.get("skills", [])})
        for user in landed
    )
    return {"analyzed": len(SAMPLE_USERS), "landed": len(landed), "similar": similar}
