"""Request contracts for the v2 Career Map API."""

from typing import Any, Literal

from pydantic import BaseModel, Field


class ProfileOverride(BaseModel):
    headline: Optional[str] = None
    currentStatus: Optional[str] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[dict]] = None
    education: Optional[List[dict]] = None
    interests: Optional[List[str]] = None
    savedGoals: Optional[List[str]] = None
    location: Optional[str] = None


class RoleSearchRequest(BaseModel):
    query: str = ""
    categories: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    limit: int = Field(default=20, ge=1, le=100)


class RecommendRequest(BaseModel):
    userId: str
    profileOverride: Optional[ProfileOverride] = None
    interests: List[str] = Field(default_factory=list)
    query: str = ""
    limit: int = Field(default=3, ge=1, le=20)


class ExplainRequest(BaseModel):
    roleId: str
    userId: Optional[str] = None


class CompareRequest(BaseModel):
    userId: str
    roleId: str
    profileOverride: Optional[ProfileOverride] = None


class PathGenerateRequest(CompareRequest):
    maxMilestones: int = Field(default=5, ge=1, le=10)


class TopApplicantRequest(BaseModel):
    userId: str
    profileOverride: Optional[ProfileOverride] = None
    limit: int = Field(default=25, ge=1, le=100)


class ExploreBreadthRequest(BaseModel):
    userId: str
    profileOverride: Optional[ProfileOverride] = None
    limit: int = Field(default=12, ge=1, le=24)


class CareerGuideMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=800)


class CareerGuideRequest(BaseModel):
    userId: str = Field(min_length=1, max_length=120)
    messages: list[CareerGuideMessage] = Field(min_length=1, max_length=8)
    profileOverride: ProfileOverride | None = None
