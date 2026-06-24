"""Generate deterministic fictional opportunity data for the demo."""
import json
from pathlib import Path

ORGS = ["Cedar Atlas", "Northline Collective", "Fieldstone Works", "Harborlight Network", "Juniper House", "Pine & Circuit", "Mosaic Assembly", "Brightwell Forum", "Grove Institute", "Meridian Commons", "Signal Foundry", "Slatebridge Alliance"]
PROGRAMS = [("Scholarship", "Scholarship", "Education"), ("Fellowship", "Fellowship", "Leadership"), ("Studio", "Cohort", "Technology"), ("Research Lab", "Research program", "Research"), ("Challenge", "Competition", "Innovation"), ("Leadership Circle", "Leadership program", "Leadership")]
SKILL_SETS = [["Programming", "Software", "Computer"], ["Research", "Science", "Data Analysis"], ["Leadership", "Communication", "Networking"], ["Design", "Research", "Communication"], ["Engineering", "Problem Solving", "Technology"]]

def build_opportunities() -> list[dict]:
    records = []
    for index in range(300):
        org = ORGS[index % len(ORGS)]
        label, kind, category = PROGRAMS[index % len(PROGRAMS)]
        skills = SKILL_SETS[index % len(SKILL_SETS)]
        records.append({"id": f"demo_{index + 1:03d}", "name": f"{org} {label} {index // len(ORGS) + 1}", "organization": org, "type": kind, "desc": f"Fictional {kind.lower()} example for exploring {category.lower()} experience.", "eligibility": ["Demo example only", "Not an active application"], "skills": skills, "category": category})
    return records

def main() -> None:
    path = Path(__file__).parent / "data" / "opportunities.json"
    path.write_text(json.dumps(build_opportunities(), indent=2) + "\n")

if __name__ == "__main__":
    main()
