"""Request contracts for the v2 Career Map API."""

from typing import Any

from pydantic import BaseModel, Field


class ProfileOverride(BaseModel):
    headline: str | None = None
    currentStatus: str | None = None
    skills: list[str] | None = None
    experience: list[dict[str, Any]] | None = None
    education: list[dict[str, Any]] | None = None
    interests: list[str] | None = None
    savedGoals: list[str] | None = None
    location: str | None = None


class RoleSearchRequest(BaseModel):
    query: str = ""
    categories: list[str] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    limit: int = Field(default=20, ge=1, le=100)


class RecommendRequest(BaseModel):
    userId: str
    profileOverride: ProfileOverride | None = None
    interests: list[str] = Field(default_factory=list)
    query: str = ""
    limit: int = Field(default=3, ge=1, le=20)


class ExplainRequest(BaseModel):
    roleId: str
    userId: str | None = None


class CompareRequest(BaseModel):
    userId: str
    roleId: str
    profileOverride: ProfileOverride | None = None


class PathGenerateRequest(CompareRequest):
    maxMilestones: int = Field(default=5, ge=1, le=10)


class TopApplicantRequest(BaseModel):
    userId: str
    profileOverride: ProfileOverride | None = None
    limit: int = Field(default=25, ge=1, le=100)
