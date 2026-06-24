// Explain matcher — ported from Muhammed's slice (src/lib/careerMatcher.js).
// Same ranking idea: for a free-text message, rank canonical roles by skill
// overlap with people who hold them + keyword relevance + a same-location
// signal. Adapted to (a) TypeScript and (b) take the flow's current profile as
// an argument instead of a hardcoded user, so Explain shares the flow identity.

import coursesData from "../../data/courses.json";
import rolesData from "../../data/roleSkills.json";
import usersData from "../../data/users.json";

interface Course { id: string; name: string; skills?: string[]; length?: { value: number; unit: string } }
interface Role { id: string; name: string; skills: string[]; description: string }
interface User { id: string; name: string; skills: string[]; degree?: string; tagline?: string }

const COURSES = coursesData as Record<string, Course[]>;
const ROLES = Object.values(rolesData as Record<string, Role>);
const USERS = usersData as User[];

export interface MatchProfile {
  skills: string[];
  current_location?: string;
  courses?: string[];
}

export interface CareerMatch {
  title: string;
  readiness: number;
  currentSkills: string[];
  missingSkills: string[];
  roleModelCount: number;
  person: string;
  path: string;
  initials: string;
  course: string;
  matchReason: string;
}

const queryTerms: Record<string, string[]> = {
  "Data Scientist": ["ai", "data", "machine learning", "ml", "research", "analytics"],
  "Software Engineer": ["code", "coding", "software", "build", "technical", "engineer"],
  "DevOps Engineer": ["cloud", "systems", "infrastructure", "devops", "technical"],
  "Product Manager": ["people", "product", "startup", "business", "strategy", "ideas"],
  "UX Designer": ["creative", "design", "psychology", "people", "experience"],
  "Marketing Specialist": ["creative", "marketing", "writing", "brand", "growth"],
  "Financial Analyst": ["finance", "money", "investing", "business", "analysis"],
  "Sales Representative": ["people", "communication", "customer", "sales", "startup"],
  "HR Coordinator": ["people", "psychology", "culture", "team", "help"],
  "Customer Service Manager": ["people", "help", "customer", "communication", "service"],
};

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function overlap(left: string[], right: string[]): string[] {
  const rightSkills = new Set(right.map(normalize));
  return left.filter((skill) => rightSkills.has(normalize(skill)));
}

function scoreQuery(title: string, message: string): number {
  const text = normalize(message);
  const matches = (queryTerms[title] || []).filter((term) => text.includes(term)).length;
  return Math.min(matches * 10, 25);
}

function courseForSkills(missingSkills: string[]): Course | undefined {
  return missingSkills.flatMap((skill) => COURSES[skill] ?? [])[0];
}

export function matchCareers(message: string, profile: MatchProfile): CareerMatch[] {
  const currentSkills = profile.skills;
  return ROLES
    .map((role) => {
      const title = role.name;
      const roleSkills = role.skills;
      const matchingSkills = overlap(currentSkills, roleSkills);
      const missingSkills = roleSkills.filter(
        (skill) => !matchingSkills.map(normalize).includes(normalize(skill))
      );
      const closestModel = [...USERS]
        .map((model) => ({ model, sharedSkills: overlap(currentSkills, model.skills).length }))
        .sort((a, b) => b.sharedSkills - a.sharedSkills)[0]?.model;
      const course = courseForSkills(missingSkills);
      const skillScore = roleSkills.length
        ? Math.round((matchingSkills.length / roleSkills.length) * 60)
        : 0;
      const intentScore = scoreQuery(title, message);
      const discoveryBoost = matchingSkills.length > 0 && matchingSkills.length < roleSkills.length ? 8 : 0;
      const readiness = Math.min(94, Math.max(18, skillScore + intentScore + discoveryBoost));

      return {
        title,
        readiness,
        currentSkills: matchingSkills.slice(0, 3),
        missingSkills: missingSkills.slice(0, 3),
        roleModelCount: USERS.length,
        person: closestModel?.name || "LinkedIn member",
        path: closestModel?.tagline || closestModel?.degree || "Similar profile in the shared dataset",
        initials:
          closestModel?.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2) || "LI",
        course: course
          ? `${course.name}${course.length ? ` · ${course.length.value} ${course.length.unit}` : ""}`
          : "Explore courses in this skill area",
        matchReason: matchingSkills.length
          ? `${matchingSkills.length} core skills overlap, plus ${intentScore} points from what you described.`
          : "This is an adjacent discovery match based on what you described.",
      };
    })
    .sort((a, b) => b.readiness - a.readiness)
    .slice(0, 3);
}

export function profileCourses(profile: MatchProfile): string[] {
  return profile.courses ?? [];
}
