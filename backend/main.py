"""FastAPI backend for the Career Map Comparison Page.

Endpoints:
  GET /api/roles             -> role catalog (map / role search consume this)
  GET /api/me                -> the logged-in profile ("you")
  GET /api/courses           -> skill -> real courses (Milestone page)
  GET /api/fit?roleId=...     -> your fit vs a role + an invisible aggregate
                                analysis of people who landed it (counts only)

Run: uvicorn backend.main:app --reload  (from the repo root)
"""

from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .fit import compute_fit
from .build_data import build_all

# Build app data directly from the real sample_data/ files at startup
# (no pre-generated files in backend/).
ROLES, CURRENT_USER, ANALYSIS, COURSES = build_all()

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
    """All roles, as a list (map + role search consume this)."""
    return list(ROLES.values())


@app.get("/api/me")
def get_me() -> dict:
    """The single logged-in profile ('you')."""
    return CURRENT_USER


@app.get("/api/courses")
def get_courses() -> dict:
    """Skill -> real courses (from course_data.json) for the Milestone page."""
    return COURSES


@app.get("/api/fit")
def get_fit(roleId: str) -> dict:
    """Your fit vs a role + an invisible aggregate analysis of people who landed it.

    The per-profile comparison is computed internally and NOT returned; the
    response exposes your fit-vs-role (ring + skills) and counts only
    (analyzed / landed / similar), which drive the "Build my path" handoff.
    """
    role = ROLES.get(roleId)
    if role is None:
        raise HTTPException(status_code=404, detail=f"Unknown roleId: {roleId}")
    result = compute_fit(CURRENT_USER["skills"], role)
    result["analysis"] = ANALYSIS.get(roleId)
    return result
