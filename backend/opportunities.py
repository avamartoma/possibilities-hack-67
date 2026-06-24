"""Generated fictional opportunity examples ranked against a profile's skills."""

import json
from pathlib import Path

from .readiness import _fold_set


OPPORTUNITIES = json.loads((Path(__file__).parent / "data" / "opportunities.json").read_text())


def rank_opportunities(profile: dict, limit: int = 12) -> list[dict]:
    user = _fold_set(profile.get("skills", []))
    ranked = []
    for opportunity in OPPORTUNITIES:
        skills = opportunity["skills"]
        matched = [skill for skill in skills if _fold_set([skill]) & user]
        missing = [skill for skill in skills if skill not in matched]
        fit = round(100 * len(matched) / len(skills))
        ranked.append({**opportunity, "fit": fit, "matchedSkills": matched, "missingSkills": missing})
    ranked.sort(key=lambda item: (-item["fit"], -len(item["matchedSkills"]), item["name"]))
    return ranked[:limit]
