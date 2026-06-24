"""
LinkedIn Career Milestone Generator
------------------------------------
Takes a young user's current profile (e.g., HS sophomore with lab research)
and generates personalized quarterly milestones toward their "goal LinkedIn profile"
by finding similar successful users in the dataset and reverse-engineering their path.

Purpose: Encourage Gen Z/Gen Alpha to update their profile quarterly with real progress.
"""

import json
from collections import Counter

# ─── Load Data ────────────────────────────────────────────────────────────────

with open("user_data.json", "r") as f:
    users = json.load(f)

with open("jobs_data.json", "r") as f:
    jobs = json.load(f)

with open("course_data.json", "r") as f:
    courses = json.load(f)

# Index jobs and courses by ID for quick lookup
jobs_index = {job["id"]: job for job in jobs}
courses_index = {course["id"]: course for course in courses}


# ─── Simulated Young User (HS Sophomore) ─────────────────────────────────────
# This represents the hackathon scenario: a high school sophomore who has done
# lab research and is exploring careers.

young_user = {
    "id": "user_new_001",
    "name": "Jordan Lee",
    "school_history": [
        {
            "school_name": "Lincoln High School",
            "degree": "High School Diploma",
            "graduation_year": 2027  # HS sophomore now
        }
    ],
    "job_history": [],  # no formal jobs yet
    "current_location": "San Francisco, CA",
    "posts_activity": [
        "Completed research internship at university lab"
    ],
    "skills": ["Python", "Data Analysis", "Research"],
    "courses": [],
    "interests": ["Artificial Intelligence", "Data Science"],  # what they WANT to explore
    "target_career": "Data Scientist"  # their dream role
}


# ─── Step 1: Find "Role Models" — similar users further along the path ────────

def calculate_similarity(young_user, existing_user):
    """
    Score how similar an existing user is to the young user's FUTURE trajectory.
    Considers: location, skills overlap, degree relevance, career direction.
    """
    score = 0

    # Location match (same city = stronger local leaderboard relevance)
    if young_user["current_location"] == existing_user["current_location"]:
        score += 20

    # Skills overlap
    young_skills = set(s.lower() for s in young_user["skills"])
    existing_skills = set(s.lower() for s in existing_user["skills"])
    overlap = young_skills & existing_skills
    score += len(overlap) * 15

    # Degree relevance to target career
    target_keywords = set(young_user["target_career"].lower().split())
    interest_keywords = set()
    for interest in young_user.get("interests", []):
        interest_keywords.update(interest.lower().split())

    for school in existing_user["school_history"]:
        degree_words = set(school["degree"].lower().split())
        if degree_words & (target_keywords | interest_keywords):
            score += 25

    # Job history — do they work in roles related to the target?
    for job_id in existing_user["job_history"]:
        if job_id in jobs_index:
            job = jobs_index[job_id]
            position_words = set(job["position"].lower().split())
            if position_words & target_keywords:
                score += 30

    # Course completion (shows active learning)
    if existing_user["courses"]:
        score += len(existing_user["courses"]) * 5

    return score


def find_role_models(young_user, top_n=5):
    """Find the top N users who represent where this young user could be."""
    scored = []
    for user in users:
        sim = calculate_similarity(young_user, user)
        if sim > 0:
            scored.append((sim, user))

    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:top_n]


# ─── Step 2: Extract the "Goal Profile" from role models ─────────────────────

def build_goal_profile(role_models, young_user):
    """
    Aggregate role model data to construct the 'ideal future LinkedIn profile'
    that the young user is working toward.
    """
    goal = {
        "target_role": young_user["target_career"],
        "skills_to_acquire": [],
        "degrees_common": [],
        "jobs_pipeline": [],  # Entry -> Mid -> Senior path
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

    # Skills the young user doesn't have yet
    young_skills = set(s.lower() for s in young_user["skills"])
    skill_counts = Counter(s.lower() for s in all_skills)
    goal["skills_to_acquire"] = [
        skill for skill, count in skill_counts.most_common(10)
        if skill not in young_skills
    ]

    # Common degrees among role models
    goal["degrees_common"] = [d for d, _ in Counter(all_degrees).most_common(5)]

    # Job level pipeline
    level_order = {"Entry": 1, "Mid": 2, "Senior": 3, "Management": 4}
    all_jobs.sort(key=lambda j: level_order.get(j["level"], 0))
    goal["jobs_pipeline"] = [
        {"position": j["position"], "level": j["level"], "industry": j["industry"],
         "salary_range": j["salary_range"], "location": j["location"]}
        for j in all_jobs[:5]
    ]

    # Recommended courses
    goal["courses_recommended"] = [
        {"name": c["name"], "level": c["level"], "skills": c["skills"],
         "length": c["length"]}
        for c in all_courses[:5]
    ]

    # Activities to start doing
    goal["activities_recommended"] = list(set(all_activities))[:5]

    return goal


# ─── Step 3: Generate Quarterly Milestones ────────────────────────────────────

def generate_milestones(young_user, goal_profile):
    """
    Create personalized quarterly milestones from NOW to their target career.
    Tailored for a HS sophomore → college → first job pipeline.
    """
    milestones = []
    current_year = 2026  # current year
    hs_grad_year = None

    for school in young_user["school_history"]:
        if "High School" in school["school_name"]:
            hs_grad_year = school["graduation_year"]

    if not hs_grad_year:
        hs_grad_year = current_year + 2  # assume sophomore

    skills_to_learn = goal_profile["skills_to_acquire"]
    courses_to_take = goal_profile["courses_recommended"]
    activities = goal_profile["activities_recommended"]

    # ── Quarter 1: Foundation (Now) ──
    milestones.append({
        "quarter": "Q3 2026 (Now)",
        "theme": "🔬 Build Your Foundation",
        "profile_updates": [
            "Add your lab research experience to Experience section",
            "List current skills: " + ", ".join(young_user["skills"]),
            "Set your career interest as: " + young_user["target_career"],
            f"Connect with 5 people in {young_user['current_location']} working in {young_user['interests'][0]}"
        ],
        "action_items": [
            f"Start course: {courses_to_take[0]['name']} ({courses_to_take[0]['level']} level)" if courses_to_take else "Explore beginner courses in your interest area",
            "Post about your lab research experience",
            "Follow 10 companies in your target industry"
        ],
        "skill_target": skills_to_learn[0] if skills_to_learn else "Explore new skills"
    })

    # ── Quarter 2: Expand ──
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
            "Attend a virtual event or webinar in your field",
            "Start a personal project using your new skills"
        ],
        "skill_target": skills_to_learn[1] if len(skills_to_learn) > 1 else "Deepen existing skills"
    })

    # ── Quarter 3: Junior Year Prep ──
    milestones.append({
        "quarter": "Q1 2027",
        "theme": "🎯 Career Clarity",
        "profile_updates": [
            "Add personal project to Featured section",
            f"Acquire skill: {skills_to_learn[2] if len(skills_to_learn) > 2 else 'TBD'}",
            "Request a recommendation from your lab mentor"
        ],
        "action_items": [
            "Apply to a summer internship or research program",
            "Publish a post about what you've learned so far",
            f"Complete a Hard-level course in {young_user['interests'][0]}" if young_user.get("interests") else "Challenge yourself with advanced content"
        ],
        "skill_target": skills_to_learn[2] if len(skills_to_learn) > 2 else "Advanced skill"
    })

    # ── Quarter 4: Pre-Senior Year ──
    milestones.append({
        "quarter": "Q2 2027",
        "theme": "🚀 Experience Builder",
        "profile_updates": [
            "Add internship/summer experience",
            "Update skills section with 5+ skills",
            "Add volunteer or extracurricular leadership"
        ],
        "action_items": [
            "Complete 3+ courses total on LinkedIn Learning",
            "Network with alumni from your target colleges",
            "Contribute to an open-source project or competition"
        ],
        "skill_target": skills_to_learn[3] if len(skills_to_learn) > 3 else "Portfolio building"
    })

    # ── Quarter 5-8: College Years (projected) ──
    college_start = hs_grad_year
    for i, q in enumerate(["Q3 2027", "Q1 2028", "Q3 2028", "Q1 2029"]):
        level = ["Entry", "Entry", "Mid-prep", "Mid"][i]
        milestones.append({
            "quarter": q,
            "theme": f"🎓 College Phase {i+1} — Level: {level}",
            "profile_updates": [
                f"Update degree progress: {goal_profile['degrees_common'][0] if goal_profile['degrees_common'] else 'Your major'}",
                f"Add skill: {skills_to_learn[4+i] if len(skills_to_learn) > 4+i else 'Specialized skill'}",
                "Add relevant coursework, clubs, or research"
            ],
            "action_items": [
                "Secure internship aligned with target career" if i >= 1 else "Join a club or org in your field",
                "Complete 1 LinkedIn Learning course per quarter",
                "Post quarterly update on your progress"
            ],
            "skill_target": skills_to_learn[4+i] if len(skills_to_learn) > 4+i else "Specialize"
        })

    # ── Goal Profile Snapshot ──
    milestones.append({
        "quarter": "🏁 GOAL (2029-2030)",
        "theme": "✨ Your Future LinkedIn Profile",
        "profile_snapshot": {
            "headline": f"{young_user['target_career']} | {goal_profile['degrees_common'][0] if goal_profile['degrees_common'] else 'Your Degree'} @ Top University",
            "skills": young_user["skills"] + goal_profile["skills_to_acquire"][:6],
            "experience": [j["position"] + f" ({j['level']})" for j in goal_profile["jobs_pipeline"][:3]],
            "salary_range": goal_profile["jobs_pipeline"][0]["salary_range"] if goal_profile["jobs_pipeline"] else "TBD",
            "location": young_user["current_location"],
            "courses_completed": len(courses_to_take),
            "network_activity": goal_profile["activities_recommended"][:3]
        }
    })

    return milestones


# ─── Run It ───────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 70)
    print(f"🎯 CAREER MILESTONE GENERATOR")
    print(f"   User: {young_user['name']} | {young_user['current_location']}")
    print(f"   Currently: HS Sophomore | Skills: {', '.join(young_user['skills'])}")
    print(f"   Target Career: {young_user['target_career']}")
    print("=" * 70)

    # Find role models
    print("\n📊 Finding people similar to your future self...\n")
    role_models = find_role_models(young_user)

    print(f"   Found {len(role_models)} role models:")
    for score, model in role_models:
        degrees = [s["degree"] for s in model["school_history"]]
        print(f"   • {model['name']} — {', '.join(degrees)} | "
              f"{model['current_location']} | Score: {score}")

    # Build goal profile
    goal = build_goal_profile(role_models, young_user)

    print(f"\n🎯 Your Goal Profile Skills Gap:")
    print(f"   Skills to acquire: {', '.join(goal['skills_to_acquire'][:6])}")
    print(f"   Degrees to consider: {', '.join(goal['degrees_common'][:3])}")

    # Generate milestones
    milestones = generate_milestones(young_user, goal)

    print("\n" + "=" * 70)
    print("📅 YOUR PERSONALIZED QUARTERLY MILESTONES")
    print("   (Update your LinkedIn profile each quarter!)")
    print("=" * 70)

    for ms in milestones:
        print(f"\n{'─' * 50}")
        print(f"📌 {ms['quarter']} — {ms['theme']}")
        print(f"{'─' * 50}")

        if "profile_updates" in ms:
            print("   Profile Updates:")
            for update in ms["profile_updates"]:
                print(f"     ✏️  {update}")

        if "action_items" in ms:
            print("   Action Items:")
            for action in ms["action_items"]:
                print(f"     ▶️  {action}")

        if "skill_target" in ms:
            print(f"   🎯 Skill Target: {ms['skill_target']}")

        if "profile_snapshot" in ms:
            snap = ms["profile_snapshot"]
            print(f"\n   {'━' * 40}")
            print(f"   📋 FUTURE LINKEDIN PROFILE PREVIEW")
            print(f"   {'━' * 40}")
            print(f"   Headline: {snap['headline']}")
            print(f"   Skills: {', '.join(snap['skills'])}")
            print(f"   Experience Path: {' → '.join(snap['experience'])}")
            print(f"   Salary Range: ${snap['salary_range']['from']}–${snap['salary_range']['to']}" if isinstance(snap['salary_range'], dict) else f"   Salary Range: {snap['salary_range']}")
            print(f"   Location: {snap['location']}")
            print(f"   Courses Completed: {snap['courses_completed']}+")
            print(f"   Activity: {', '.join(snap['network_activity'])}")

    print("\n" + "=" * 70)
    print("💡 TIP: Come back every quarter to check off milestones and update")
    print("   your profile. Your heatmap pin moves closer with each update!")
    print("=" * 70)
