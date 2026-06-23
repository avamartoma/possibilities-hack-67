"""
LinkedIn Career Milestone Generator — Flask Backend
Serves the milestone generator + local leaderboard as a web app.
Uses Claude API for personalized AI-generated milestones.
"""

from flask import Flask, jsonify, request, send_from_directory
import json
import os
from collections import Counter
import anthropic

app = Flask(__name__, static_folder="static")

# ─── Claude API Client ────────────────────────────────────────────────────────
# Set your API key as an environment variable: export ANTHROPIC_API_KEY="sk-ant-..."
claude_client = anthropic.Anthropic()

# ─── Load Data ────────────────────────────────────────────────────────────────

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(BASE_DIR, "sample_data", "user_data.json"), "r") as f:
    users = json.load(f)

with open(os.path.join(BASE_DIR, "sample_data", "jobs_data.json"), "r") as f:
    jobs = json.load(f)

with open(os.path.join(BASE_DIR, "sample_data", "course_data.json"), "r") as f:
    courses = json.load(f)

jobs_index = {job["id"]: job for job in jobs}
courses_index = {course["id"]: course for course in courses}


# ─── Core Logic ───────────────────────────────────────────────────────────────

def calculate_similarity(young_user, existing_user):
    score = 0
    if young_user["current_location"] == existing_user["current_location"]:
        score += 20
    young_skills = set(s.lower() for s in young_user["skills"])
    existing_skills = set(s.lower() for s in existing_user["skills"])
    overlap = young_skills & existing_skills
    score += len(overlap) * 15

    target_keywords = set(young_user["target_career"].lower().split())
    interest_keywords = set()
    for interest in young_user.get("interests", []):
        interest_keywords.update(interest.lower().split())

    for school in existing_user["school_history"]:
        degree_words = set(school["degree"].lower().split())
        if degree_words & (target_keywords | interest_keywords):
            score += 25

    for job_id in existing_user["job_history"]:
        if job_id in jobs_index:
            job = jobs_index[job_id]
            position_words = set(job["position"].lower().split())
            if position_words & target_keywords:
                score += 30

    if existing_user["courses"]:
        score += len(existing_user["courses"]) * 5

    return score


def find_role_models(young_user, top_n=5):
    scored = []
    for user in users:
        sim = calculate_similarity(young_user, user)
        if sim > 0:
            scored.append((sim, user))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:top_n]


def build_goal_profile(role_models, young_user):
    goal = {
        "target_role": young_user["target_career"],
        "skills_to_acquire": [],
        "degrees_common": [],
        "jobs_pipeline": [],
        "courses_recommended": [],
        "activities_recommended": []
    }

    all_skills = []
    all_degrees = []
    all_jobs = []
    all_courses = []
    all_activities = []

    for score, model in role_models:
        all_skills.extend(model["skills"])
        for school in model["school_history"]:
            all_degrees.append(school["degree"])
        for job_id in model["job_history"]:
            if job_id in jobs_index:
                all_jobs.append(jobs_index[job_id])
        for course_id in model["courses"]:
            if course_id in courses_index:
                all_courses.append(courses_index[course_id])
        all_activities.extend(model["posts_activity"])

    young_skills = set(s.lower() for s in young_user["skills"])
    skill_counts = Counter(s.lower() for s in all_skills)
    goal["skills_to_acquire"] = [
        skill for skill, count in skill_counts.most_common(10)
        if skill not in young_skills
    ]
    goal["degrees_common"] = [d for d, _ in Counter(all_degrees).most_common(5)]

    level_order = {"Entry": 1, "Mid": 2, "Senior": 3, "Management": 4}
    all_jobs.sort(key=lambda j: level_order.get(j["level"], 0))
    goal["jobs_pipeline"] = [
        {"position": j["position"], "level": j["level"], "industry": j["industry"],
         "salary_range": j["salary_range"], "location": j["location"]}
        for j in all_jobs[:5]
    ]
    goal["courses_recommended"] = [
        {"name": c["name"], "level": c["level"], "skills": c["skills"],
         "length": c["length"]}
        for c in all_courses[:5]
    ]
    goal["activities_recommended"] = list(set(all_activities))[:5]
    return goal


def generate_milestones_with_claude(young_user, goal_profile):
    """
    Use Claude API to generate personalized, context-aware quarterly milestones.
    Claude analyzes aggregated role model data and generates attainable opportunities
    specific to the user's location, stage, and interests.
    Falls back to basic generation if the API call fails.
    """
    prompt = f"""You are a career advisor helping a Gen Z student close the gap between where they are and their dream career. You've analyzed profiles of people who were once in a similar position and are now successful in the target field.

STUDENT PROFILE:
- Name: {young_user['name']}
- School: {young_user['school_history'][0]['school_name']}
- Current Level: {young_user['school_history'][0]['degree']}
- Graduation Year: {young_user['school_history'][0]['graduation_year']}
- Location: {young_user['current_location']}
- Current Skills: {', '.join(young_user['skills'])}
- Interests: {', '.join(young_user.get('interests', []))}
- Experience So Far: {', '.join(young_user.get('posts_activity', []))}
- Target Career: {young_user['target_career']}

DATA FROM SIMILAR SUCCESSFUL PROFILES (people who were in this student's position and made it):
- Skills they built: {', '.join(goal_profile['skills_to_acquire'][:8])}
- Degrees they pursued: {', '.join(goal_profile['degrees_common'][:3])}
- Job progression they followed: {json.dumps(goal_profile['jobs_pipeline'][:3], indent=2)}
- Courses they completed: {json.dumps(goal_profile['courses_recommended'][:4], indent=2)}
- Activities that helped them: {', '.join(goal_profile['activities_recommended'][:4])}

YOUR TASK:
Generate a "Close the Gap" plan — 6-8 quarterly milestones from NOW (Q3 2026) through their first real role.

For EACH milestone, give SPECIFIC attainable opportunities based on their situation:
- Local or remote job/internship listings they could apply to (entry-level, part-time OK)
- Specific online courses or certifications (reference the actual course names from the data when possible)
- Volunteering opportunities relevant to their field
- Projects they could build (with specific ideas, not vague "start a project")
- Fellowships, competitions, or programs for students at their level
- Networking actions (who to connect with, what events to attend)

This is for gamification — they're on a local leaderboard in {young_user['current_location']} with peers doing similar things. Each quarter they should have a reason to UPDATE THEIR LINKEDIN PROFILE with new accomplishments.

Return ONLY valid JSON (no markdown, no explanation) in this exact format:
[
  {{
    "quarter": "Q3 2026 (Now)",
    "theme": "emoji + short theme name",
    "profile_updates": ["specific thing to add/change on their LinkedIn profile"],
    "opportunities": {{
      "courses_certs": ["specific course or certification to pursue"],
      "jobs_internships": ["specific type of role to apply for, with context"],
      "projects": ["specific project idea with details"],
      "volunteering": ["specific volunteering opportunity"],
      "networking": ["specific networking action"]
    }},
    "skill_target": "one skill to focus on this quarter",
    "streak_goal": "daily/weekly habit to maintain streak (e.g., '3 LinkedIn posts this month')"
  }},
  ...
  {{
    "quarter": "🏁 GOAL",
    "theme": "✨ Your Dream LinkedIn Profile",
    "profile_snapshot": {{
      "headline": "their future headline",
      "skills": ["list", "of", "skills"],
      "experience": ["Role 1 (Level)", "Role 2 (Level)"],
      "salary_range": {{"from": "number", "to": "number"}},
      "location": "{young_user['current_location']}",
      "courses_completed": 5,
      "network_activity": ["activity1", "activity2"]
    }}
  }}
]

Make it PERSONAL and ATTAINABLE. Reference real course names from the data. Think about what a {young_user['school_history'][0]['degree']} student in {young_user['current_location']} could realistically do this quarter. Be specific — not "learn Python" but "complete the Machine Learning Fundamentals course (5 hrs, Easy level) and build a sentiment analysis project using Twitter data." Use emojis in themes."""

    try:
        message = claude_client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=3000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        response_text = message.content[0].text.strip()
        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()

        milestones = json.loads(response_text)
        return milestones

    except Exception as e:
        print(f"⚠️  Claude API error: {e}")
        print("   Falling back to template-based generation...")
        return generate_milestones_fallback(young_user, goal_profile)


def generate_milestones_fallback(young_user, goal_profile):
    """Fallback milestone generation if Claude API is unavailable."""
    milestones = []
    skills_to_learn = goal_profile["skills_to_acquire"]
    courses_to_take = goal_profile["courses_recommended"]

    milestones.append({
        "quarter": "Q3 2026 (Now)",
        "theme": "🔬 Build Your Foundation",
        "profile_updates": [
            "Add your research/experience to Experience section",
            "List current skills: " + ", ".join(young_user["skills"]),
            "Set career interest: " + young_user["target_career"],
            f"Connect with 5 people in {young_user['current_location']}"
        ],
        "action_items": [
            f"Start course: {courses_to_take[0]['name']} ({courses_to_take[0]['level']})" if courses_to_take else "Explore beginner courses",
            "Post about your experience",
            "Follow 10 companies in your target industry"
        ],
        "skill_target": skills_to_learn[0] if skills_to_learn else "Explore"
    })

    milestones.append({
        "quarter": "Q4 2026",
        "theme": "📚 Skill Building Sprint",
        "profile_updates": [
            f"Add new skill: {skills_to_learn[1] if len(skills_to_learn) > 1 else 'TBD'}",
            "Update headline to reflect career direction",
            "Add any new projects or competitions"
        ],
        "action_items": [
            f"Complete course: {courses_to_take[1]['name']}" if len(courses_to_take) > 1 else "Take an intermediate course",
            "Attend a virtual event or webinar",
            "Start a personal project"
        ],
        "skill_target": skills_to_learn[1] if len(skills_to_learn) > 1 else "Deepen skills"
    })

    milestones.append({
        "quarter": "Q1 2027",
        "theme": "🎯 Career Clarity",
        "profile_updates": [
            "Add personal project to Featured section",
            f"Acquire skill: {skills_to_learn[2] if len(skills_to_learn) > 2 else 'TBD'}",
            "Request a recommendation from a mentor"
        ],
        "action_items": [
            "Apply to a summer internship or program",
            "Publish a post about your learning journey",
            "Complete a Hard-level course"
        ],
        "skill_target": skills_to_learn[2] if len(skills_to_learn) > 2 else "Advanced"
    })

    milestones.append({
        "quarter": "Q2 2027",
        "theme": "🚀 Experience Builder",
        "profile_updates": [
            "Add internship/summer experience",
            "Update skills section with 5+ skills",
            "Add leadership or volunteer roles"
        ],
        "action_items": [
            "Complete 3+ courses total",
            "Network with alumni from target colleges",
            "Contribute to a competition or open-source project"
        ],
        "skill_target": skills_to_learn[3] if len(skills_to_learn) > 3 else "Portfolio"
    })

    for i, q in enumerate(["Q3 2027", "Q1 2028", "Q3 2028", "Q1 2029"]):
        level = ["Entry", "Entry", "Mid-prep", "Mid"][i]
        milestones.append({
            "quarter": q,
            "theme": f"🎓 College Phase {i+1} — Level: {level}",
            "profile_updates": [
                f"Update degree: {goal_profile['degrees_common'][0] if goal_profile['degrees_common'] else 'Your major'}",
                f"Add skill: {skills_to_learn[4+i] if len(skills_to_learn) > 4+i else 'Specialized skill'}",
                "Add coursework, clubs, or research"
            ],
            "action_items": [
                "Secure internship" if i >= 1 else "Join a club in your field",
                "Complete 1 LinkedIn Learning course",
                "Post quarterly update"
            ],
            "skill_target": skills_to_learn[4+i] if len(skills_to_learn) > 4+i else "Specialize"
        })

    milestones.append({
        "quarter": "🏁 GOAL (2029-2030)",
        "theme": "✨ Your Future LinkedIn Profile",
        "profile_snapshot": {
            "headline": f"{young_user['target_career']} | {goal_profile['degrees_common'][0] if goal_profile['degrees_common'] else 'Your Degree'} @ Top University",
            "skills": young_user["skills"] + goal_profile["skills_to_acquire"][:6],
            "experience": [j["position"] + f" ({j['level']})" for j in goal_profile["jobs_pipeline"][:3]],
            "salary_range": goal_profile["jobs_pipeline"][0]["salary_range"] if goal_profile["jobs_pipeline"] else {"from": "TBD", "to": "TBD"},
            "location": young_user["current_location"],
            "courses_completed": max(len(courses_to_take), 5),
            "network_activity": goal_profile["activities_recommended"][:3]
        }
    })

    return milestones


# ─── Local Leaderboard ────────────────────────────────────────────────────────

def generate_leaderboard(young_user):
    """
    Create a local leaderboard of users in the same location
    who are on similar career paths, ranked by weekly progress.
    """
    location = young_user["current_location"]
    target_keywords = set(young_user["target_career"].lower().split())
    interest_keywords = set()
    for interest in young_user.get("interests", []):
        interest_keywords.update(interest.lower().split())

    local_users = [u for u in users if u["current_location"] == location]

    leaderboard = []
    for user in local_users:
        # Calculate a "progress score" based on activity
        progress = 0
        progress += len(user["courses"]) * 20
        progress += len(user["posts_activity"]) * 10
        progress += len(user["skills"]) * 5
        progress += len(user["job_history"]) * 15

        # Bonus for relevant skills
        user_skills = set(s.lower() for s in user["skills"])
        if user_skills & (target_keywords | interest_keywords):
            progress += 25

        leaderboard.append({
            "name": user["name"],
            "id": user["id"],
            "skills": user["skills"][:4],
            "courses_completed": len(user["courses"]),
            "activity_count": len(user["posts_activity"]),
            "progress_score": progress,
            "degree": user["school_history"][-1]["degree"] if user["school_history"] else "N/A"
        })

    leaderboard.sort(key=lambda x: x["progress_score"], reverse=True)
    return leaderboard[:10]


# ─── API Routes ───────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/api/generate", methods=["POST"])
def generate():
    """Generate milestones for a user profile using Claude AI."""
    data = request.json
    young_user = {
        "id": "user_custom",
        "name": data.get("name", "Student"),
        "school_history": [{
            "school_name": data.get("school", "High School"),
            "degree": data.get("degree", "High School Diploma"),
            "graduation_year": int(data.get("grad_year", 2027))
        }],
        "job_history": [],
        "current_location": data.get("location", "San Francisco, CA"),
        "posts_activity": [data.get("experience", "Research experience")],
        "skills": [s.strip() for s in data.get("skills", "").split(",") if s.strip()],
        "interests": [s.strip() for s in data.get("interests", "").split(",") if s.strip()],
        "target_career": data.get("target_career", "Software Engineer"),
        "courses": []
    }

    role_models = find_role_models(young_user)
    goal = build_goal_profile(role_models, young_user)

    # Use Claude AI for personalized milestones
    milestones = generate_milestones_with_claude(young_user, goal)

    leaderboard = generate_leaderboard(young_user)

    return jsonify({
        "user": young_user,
        "role_models": [{"name": m["name"], "score": s, "degree": m["school_history"][-1]["degree"],
                         "location": m["current_location"], "skills": m["skills"][:5]}
                        for s, m in role_models],
        "goal_profile": goal,
        "milestones": milestones,
        "leaderboard": leaderboard,
        "ai_powered": True
    })


@app.route("/api/leaderboard", methods=["POST"])
def leaderboard():
    """Get local leaderboard for a location."""
    data = request.json
    young_user = {
        "current_location": data.get("location", "San Francisco, CA"),
        "target_career": data.get("target_career", "Software Engineer"),
        "interests": [s.strip() for s in data.get("interests", "").split(",") if s.strip()]
    }
    lb = generate_leaderboard(young_user)
    return jsonify({"leaderboard": lb})


if __name__ == "__main__":
    print("🚀 Starting LinkedIn Career Milestone Generator...")
    print("   Open http://localhost:5000 in your browser")
    app.run(debug=True, port=5000)
