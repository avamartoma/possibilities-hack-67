// Data access for the Comparison Page.
// Primary path: the FastAPI backend (proxied via Next.js rewrites at /api/*).
// Fallback: bundled JSON + the client-side computeFit, so the demo never breaks.

import type { Role, User, FitResult, Course, MilestonePlan, UserProfile, ProfileOverride, CareerRole, RoleRecommendation, RoleComparison, PersonalizedPath, RoleExplanation, TopApplicantJobs, ExploreRoles, CareerGuideMessage, CareerGuideResponse } from "./types";
import { computeFit } from "./fit";
import rolesData from "../data/roleSkills.json";
import usersData from "../data/users.json";
import coursesData from "../data/courses.json";

const ROLES = rolesData as Record<string, Role>;
const USERS = usersData as User[];
const COURSES = coursesData as Record<string, Course[]>;

async function tryFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null; // backend down -> caller falls back to bundled data
  }
}

async function postApi<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function getRoles(): Promise<Role[]> {
  const live = await tryFetch<Role[]>("/api/roles");
  return live ?? Object.values(ROLES);
}

export async function getUsers(): Promise<User[]> {
  const live = await tryFetch<User[]>("/api/users");
  return live ?? USERS;
}

// Skill -> real courses (from course_data.json), for the Milestone page.
export async function getCourses(): Promise<Record<string, Course[]>> {
  const live = await tryFetch<Record<string, Course[]>>("/api/courses");
  return live ?? COURSES;
}

export async function getFit(userId: string, roleId: string): Promise<FitResult> {
  const live = await tryFetch<FitResult>(
    `/api/fit?userId=${encodeURIComponent(userId)}&roleId=${encodeURIComponent(roleId)}`
  );
  if (live) return live;

  // Fallback: compute locally from bundled data.
  const user = USERS.find((u) => u.id === userId);
  const role = ROLES[roleId];
  if (!user || !role) {
    throw new Error(`Unknown user (${userId}) or role (${roleId})`);
  }
  return computeFit(user.skills, role);
}

export async function getMilestonePlan(userId: string, roleId: string): Promise<MilestonePlan> {
  const live = await tryFetch<MilestonePlan>(
    `/api/milestones?userId=${encodeURIComponent(userId)}&roleId=${encodeURIComponent(roleId)}`
  );
  if (live) return live;

  const fit = await getFit(userId, roleId);
  const steps = fit.missingSkills.slice(0, 5).map((skill, index) => {
    const course = COURSES[skill]?.[0];
    return {
      step: index + 1,
      skill,
      title: `Build confidence in ${skill}`,
      course: course?.name ?? `Build a project using ${skill}`,
      courseLength: course?.length,
      actions: [
        `Complete ${course?.name ?? `a project using ${skill}`}`,
        `Add evidence of ${skill} to your LinkedIn profile`,
        `Connect with one ${fit.role.name} who uses ${skill}`,
      ],
    };
  });
  return { ...fit, readiness: fit.percent, milestones: steps.length ? steps : [{ step: 1, skill: "Portfolio evidence", title: "Turn your existing skills into proof of work", course: undefined, courseLength: undefined, actions: ["Publish a project that demonstrates your readiness", "Ask a relevant connection for feedback", "Update your LinkedIn profile with the outcome"] }] };
}

export async function getProfile(userId: string): Promise<UserProfile> {
  const response = await fetch(`/api/profile/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error(`Profile not found (${response.status})`);
  return response.json() as Promise<UserProfile>;
}

export function searchRoles(input: { query?: string; categories?: string[]; skills?: string[]; limit?: number } = {}): Promise<{ roles: CareerRole[] }> {
  return postApi("/api/roles/search", input);
}

export async function getRole(roleId: string): Promise<CareerRole> {
  const response = await fetch(`/api/roles/${encodeURIComponent(roleId)}`);
  if (!response.ok) throw new Error(`Role not found (${response.status})`);
  return response.json() as Promise<CareerRole>;
}

export function recommendRoles(input: { userId: string; profileOverride?: ProfileOverride; interests?: string[]; query?: string; limit?: number }): Promise<{ profileId: string; recommendations: RoleRecommendation[] }> {
  return postApi("/api/roles/recommend", input);
}

export function explainRole(input: { roleId: string; userId?: string }): Promise<RoleExplanation> {
  return postApi("/api/roles/explain", input);
}

export function compareRole(input: { userId: string; roleId: string; profileOverride?: ProfileOverride }): Promise<RoleComparison> {
  return postApi("/api/compare", input);
}

export function generatePath(input: { userId: string; roleId: string; profileOverride?: ProfileOverride; maxMilestones?: number }): Promise<PersonalizedPath> {
  return postApi("/api/path/generate", input);
}

// v3: real postings ranked for how well the user fits them (Career Guide scroller).
export function getTopApplicantJobs(input: { userId: string; profileOverride?: ProfileOverride; limit?: number }): Promise<TopApplicantJobs> {
  return postApi("/api/jobs/top-applicant", input);
}

// v4: curiosity/stretch roles for the Career Guide (low-fit, adjacent, new-industry).
export function exploreBreadth(input: { userId: string; profileOverride?: ProfileOverride; limit?: number }): Promise<ExploreRoles> {
  return postApi("/api/roles/explore-breadth", input);
}

export function careerGuideChat(input: { userId: string; messages: CareerGuideMessage[]; profileOverride?: ProfileOverride }): Promise<CareerGuideResponse> {
  return postApi("/api/career-guide/chat", input);
}
