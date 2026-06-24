"""FastAPI API for the Career Map demo.

The original GET endpoints remain available for the existing frontend.  The
v2 endpoints provide normalized, frontend-ready data for the redesigned flow.
"""

import json
import os
import time
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .analysis import aggregate_role_analysis
from .comparison import compare_profile_to_role, recommend_exploratory_roles, recommend_roles
from .career_guide import guide
from .fit import compute_fit
from .jobs import rank_top_applicant_jobs
from .milestones import build_milestone_plan
from .pathing import generate_path
from .profile_source import resolve_profile
from .profiles import apply_override
from .roles import explain_role, normalize_role, search_roles
from .schemas import CareerGuideRequest, CompareRequest, ExplainRequest, ExploreBreadthRequest, PathGenerateRequest, RecommendRequest, RoleSearchRequest, TopApplicantRequest

DATA_DIR = Path(__file__).parent / "data"
# v3: the full 207-role catalog (built from jobs_data.json by precompute) backs
# Discover/search. Canonical ids are preserved within it, so legacy /api/fit and
# /api/milestones keep resolving.
ROLES: dict = json.loads((DATA_DIR / "rolesCatalog.json").read_text())
USERS: list = json.loads((DATA_DIR / "users.json").read_text())
COURSES: dict = json.loads((DATA_DIR / "courses.json").read_text())
USERS_BY_ID = {user["id"]: user for user in USERS}

app = FastAPI(title="Career Map API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"], allow_methods=["*"], allow_headers=["*"])
RATE_LIMIT: dict[str, list[float]] = {}


def seeded_profile(user_id: str) -> dict:
    profile = resolve_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail=f"Unknown userId: {user_id}")
    return profile


def seeded_role(role_id: str) -> dict:
    role = ROLES.get(role_id)
    if role is None:
        raise HTTPException(status_code=404, detail=f"Unknown roleId: {role_id}")
    return role


def client_ip(request: Request) -> str:
    # Render is the only trusted proxy. Locally, do not let clients spoof their IP.
    host = request.client.host if request.client else "unknown"
    if os.getenv("RENDER") == "true":
        return request.headers.get("x-forwarded-for", host).split(",")[0].strip()
    return host


def enforce_guide_rate_limit(request: Request) -> None:
    now = time.monotonic()
    ip = client_ip(request)
    recent = [stamp for stamp in RATE_LIMIT.get(ip, []) if now - stamp < 60]
    if len(recent) >= 8:
        RATE_LIMIT[ip] = recent
        raise HTTPException(status_code=429, detail="Too many guide requests")
    recent.append(now)
    RATE_LIMIT[ip] = recent


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "roles": len(ROLES), "users": len(USERS), "courseSkills": len(COURSES)}


# Compatibility routes used by the current frontend.
@app.get("/api/roles")
def get_roles() -> list[dict]:
    return list(ROLES.values())


@app.get("/api/users")
def get_users() -> list[dict]:
    return USERS


@app.get("/api/courses")
def get_courses() -> dict:
    return COURSES


@app.get("/api/fit")
def get_fit(userId: str, roleId: str) -> dict:
    user = USERS_BY_ID.get(userId)
    role = ROLES.get(roleId)
    if user is None:
        raise HTTPException(status_code=404, detail=f"Unknown userId: {userId}")
    if role is None:
        raise HTTPException(status_code=404, detail=f"Unknown roleId: {roleId}")
    result = compute_fit(user["skills"], role)
    result["analysis"] = aggregate_role_analysis(role["name"], user["skills"])
    return result


@app.get("/api/milestones")
def get_milestones(userId: str, roleId: str) -> dict:
    user = USERS_BY_ID.get(userId)
    role = ROLES.get(roleId)
    if user is None:
        raise HTTPException(status_code=404, detail=f"Unknown userId: {userId}")
    if role is None:
        raise HTTPException(status_code=404, detail=f"Unknown roleId: {roleId}")
    return build_milestone_plan(user, role, COURSES)


@app.get("/api/profile/{userId}")
def get_profile(userId: str) -> dict:
    return seeded_profile(userId)


@app.post("/api/roles/search")
def post_role_search(request: RoleSearchRequest) -> dict:
    profile_skills = seeded_profile(request.userId)["skills"] if request.userId else None
    return {"roles": search_roles(ROLES, request.query, request.categories, request.skills, request.limit, profile_skills)}


@app.get("/api/roles/{roleId}")
def get_role_detail(roleId: str) -> dict:
    return normalize_role(seeded_role(roleId))


@app.post("/api/roles/recommend")
def post_recommend(request: RecommendRequest) -> dict:
    profile = apply_override(seeded_profile(request.userId), request.profileOverride)
    return {"profileId": profile["id"], "recommendations": recommend_roles(profile, ROLES, request.interests, request.query, request.limit)}


@app.post("/api/roles/explore-breadth")
def post_explore_breadth(request: ExploreBreadthRequest) -> dict:
    profile = apply_override(seeded_profile(request.userId), request.profileOverride)
    return {"profileId": profile["id"], "exploratoryRoles": recommend_exploratory_roles(profile, ROLES, request.limit)}


@app.post("/api/roles/explain")
def post_explain(request: ExplainRequest) -> dict:
    profile = seeded_profile(request.userId) if request.userId else None
    return explain_role(seeded_role(request.roleId), profile, ROLES)


@app.post("/api/compare")
def post_compare(request: CompareRequest) -> dict:
    profile = apply_override(seeded_profile(request.userId), request.profileOverride)
    return compare_profile_to_role(profile, seeded_role(request.roleId))


@app.post("/api/path/generate")
def post_path_generate(request: PathGenerateRequest) -> dict:
    profile = apply_override(seeded_profile(request.userId), request.profileOverride)
    comparison = compare_profile_to_role(profile, seeded_role(request.roleId))
    return generate_path(comparison, COURSES, request.maxMilestones)


@app.post("/api/jobs/top-applicant")
def post_top_applicant_jobs(request: TopApplicantRequest) -> dict:
    profile = apply_override(seeded_profile(request.userId), request.profileOverride)
    jobs = rank_top_applicant_jobs(profile, ROLES, request.limit)
    return {"jobs": jobs, "total": len(jobs)}


@app.post("/api/career-guide/chat")
def post_career_guide_chat(payload: CareerGuideRequest, request: Request) -> dict:
    enforce_guide_rate_limit(request)
    profile = apply_override(seeded_profile(payload.userId), payload.profileOverride)
    messages = [message.model_dump() if hasattr(message, "model_dump") else message.dict() for message in payload.messages]
    return guide(profile, ROLES, messages, recommend_roles)
