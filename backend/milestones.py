"""Deterministic milestone-plan builder for the shared Career Guide flow."""

from .fit import compute_fit


def build_milestone_plan(user, role, courses_by_skill):
    """Turn one role-fit result into focused, course-backed next actions."""
    fit = compute_fit(user["skills"], role)
    missing = fit["missingSkills"]
    milestones = []

    for index, skill in enumerate(missing[:5]):
        course = (courses_by_skill.get(skill) or [None])[0]
        course_name = course["name"] if course else f"Build a project using {skill}"
        course_length = course.get("length") if course else None
        milestones.append({
            "step": index + 1,
            "skill": skill,
            "title": f"Build confidence in {skill}",
            "course": course_name,
            "courseLength": course_length,
            "actions": [
                f"Complete {course_name}",
                f"Add evidence of {skill} to your LinkedIn profile",
                f"Connect with one {role['name']} who uses {skill}",
            ],
        })

    if not milestones:
        milestones.append({
            "step": 1,
            "skill": "Portfolio evidence",
            "title": "Turn your existing skills into proof of work",
            "course": None,
            "courseLength": None,
            "actions": [
                f"Publish a project that demonstrates your {role['name']} readiness",
                "Ask a relevant connection for feedback",
                "Update your LinkedIn profile with the outcome",
            ],
        })

    return {
        "role": fit["role"],
        "readiness": fit["percent"],
        "haveSkills": fit["haveSkills"],
        "missingSkills": missing,
        "milestones": milestones,
    }
