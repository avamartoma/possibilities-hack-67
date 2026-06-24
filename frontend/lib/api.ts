// Data access for the Comparison Page.
// Primary path: the FastAPI backend (proxied via Next.js rewrites at /api/*).
// Fallback: bundled JSON + the client-side computeFit, so the demo never breaks.

import type { Role, User, FitResult, Course, Analysis } from "./types";
import { computeFit } from "./fit";
import rolesData from "../data/roleSkills.json";
import meData from "../data/me.json";
import analysisData from "../data/analysis.json";
import coursesData from "../data/courses.json";

const ROLES = rolesData as Record<string, Role>;
const ME = meData as User;
const ANALYSIS = analysisData as Record<string, Analysis>;
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

export async function getRoles(): Promise<Role[]> {
  const live = await tryFetch<Role[]>("/api/roles");
  return live ?? Object.values(ROLES);
}

// The single logged-in profile ("you").
export async function getMe(): Promise<User> {
  const live = await tryFetch<User>("/api/me");
  return live ?? ME;
}

// Skill -> real courses (from course_data.json), for the Milestone page.
export async function getCourses(): Promise<Record<string, Course[]>> {
  const live = await tryFetch<Record<string, Course[]>>("/api/courses");
  return live ?? COURSES;
}

// Your fit vs a role + an invisible aggregate analysis (counts only) of people
// who landed it.
export async function getFit(roleId: string): Promise<FitResult> {
  const live = await tryFetch<FitResult>(
    `/api/fit?roleId=${encodeURIComponent(roleId)}`
  );
  if (live) return live;

  // Fallback: compute locally from bundled data.
  const role = ROLES[roleId];
  if (!role) throw new Error(`Unknown role (${roleId})`);
  return computeFit(ME.skills, role, ANALYSIS[roleId]);
}
