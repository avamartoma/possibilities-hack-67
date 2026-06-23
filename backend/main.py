"""FastAPI backend for the Career Map Comparison Page.

Endpoints:
  GET /api/roles            -> all roles (Person A's map can consume this too)
  GET /api/users            -> demo users (shared avatar/user picker)
  GET /api/fit?userId&roleId -> FitResult for a user against a role

Run: uvicorn backend.main:app --reload  (from the repo root)
"""

from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .fit import compute_fit
from .build_data import build_all

# Build app data directly from the real sample_data/ files at startup
# (no pre-generated files in backend/).
ROLES, USERS, COURSES = build_all()
USERS_BY_ID = {u["id"]: u for u in USERS}

app = FastAPI(title="Career Map — Comparison API")

# Frontend dev server backstop (Next.js rewrites are the primary path, see README).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/roles")
def get_roles() -> List[dict]:
    """All roles, as a list (map + role pickers consume this)."""
    return list(ROLES.values())


@app.get("/api/users")
def get_users() -> List[dict]:
    """Demo users for the avatar / user picker."""
    return USERS


@app.get("/api/courses")
def get_courses() -> dict:
    """Skill -> real courses (from course_data.json) for the Milestone page."""
    return COURSES


@app.get("/api/fit")
def get_fit(userId: str, roleId: str) -> dict:
    """Compute a user's fit against a role."""
    user = USERS_BY_ID.get(userId)
    if user is None:
        raise HTTPException(status_code=404, detail=f"Unknown userId: {userId}")
    role = ROLES.get(roleId)
    if role is None:
        raise HTTPException(status_code=404, detail=f"Unknown roleId: {roleId}")
    return compute_fit(user["skills"], role)
