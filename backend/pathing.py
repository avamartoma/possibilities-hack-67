"""Course-backed personalized path generation."""

from datetime import datetime, timezone


def generate_path(comparison: dict, courses: dict, max_milestones: int) -> dict:
    missing = [gap for gap in comparison["skillGaps"] if gap["status"] == "missing"]
    milestones = []
    for index, gap in enumerate(missing[:max_milestones], start=1):
        skill = gap["skill"]
        course = (courses.get(skill) or [None])[0]
        milestones.append({"order": index, "title": f"Build confidence in {skill}", "targetSkill": skill, "reason": f"{skill} is a core skill for {comparison['role']['name']} that is not yet visible in your profile.", "course": course, "project": f"Build and publish a small project that demonstrates {skill} in a {comparison['role']['name']} scenario.", "networkingAction": f"Ask one {comparison['role']['name']} professional how they use {skill} day to day.", "profileCheckpoint": f"Add a result, artifact, or credential showing {skill} to your profile.", "completionState": "not_started"})
    if not milestones:
        milestones.append({"order": 1, "title": "Turn strengths into proof", "targetSkill": "Portfolio evidence", "reason": "Your listed core skills already overlap with the role.", "course": None, "project": f"Publish a project showing your {comparison['role']['name']} readiness.", "networkingAction": "Ask a relevant professional for feedback on your portfolio.", "profileCheckpoint": "Add the outcome and evidence to your profile.", "completionState": "not_started"})
    return {"profileId": comparison["profile"]["id"], "role": comparison["role"], "readinessScore": comparison["readinessScore"], "readinessBreakdown": comparison.get("readinessBreakdown"), "startingStrengths": comparison["strengths"], "skillGaps": comparison["skillGaps"], "milestones": milestones, "generatedAt": datetime.now(timezone.utc).isoformat(), "disclaimer": "Demo guidance based on seeded data; completing milestones does not guarantee an outcome."}
