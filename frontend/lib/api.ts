// Data access for the Comparison Page.
// Primary path: the FastAPI backend (proxied via Next.js rewrites at /api/*).
// Fallback: bundled JSON + the client-side computeFit, so the demo never breaks.

import type { Role, User, FitResult, Course } from "./types";
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
