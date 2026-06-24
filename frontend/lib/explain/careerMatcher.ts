// Explain matcher — ported from Muhammed's slice (src/lib/careerMatcher.js).
// Same ranking idea: for a free-text message, rank canonical roles by skill
// overlap with people who hold them + keyword relevance + a same-location
// signal. Adapted to (a) TypeScript and (b) take the flow's current profile as
// an argument instead of a hardcoded user, so Explain shares the flow identity.

import courses from "../../../sample_data/course_data.json";
import jobs from "../../../sample_data/jobs_data.json";
import users from "../../../sample_data/user_data.json";

interface RawJob { id: string; position: string; [k: string]: unknown }
interface RawCourse { id: string; name: string; skills: string[]; length: { value: number; unit: string }; [k: string]: unknown }
interface RawUser { id: string; name: string; skills: string[]; job_history: string[]; current_location?: string; courses?: string[]; [k: string]: unknown }

const JOBS = jobs as unknown as RawJob[];
const COURSES = courses as unknown as RawCourse[];
const USERS = users as unknown as RawUser[];

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

const jobsById = new Map(JOBS.map((job) => [job.id, job]));
const courseById = new Map(COURSES.map((course) => [course.id, course]));

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

// Only the canonical roles wired to the Comparison page are routable.
const ROUTABLE = new Set(Object.keys(queryTerms));

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function overlap(left: string[], right: string[]): string[] {
  const rightSkills = new Set(right.map(normalize));
  return left.filter((skill) => rightSkills.has(normalize(skill)));
}

function userHasRole(user: RawUser, title: string): boolean {
  return user.job_history.some((jobId) => jobsById.get(jobId)?.position === title);
}

function mostCommonSkills(roleModels: RawUser[]): string[] {
  const counts = new Map<string, { label: string; count: number }>();
  roleModels.forEach((user) => {
    user.skills.forEach((skill) => {
      const key = normalize(skill);
      counts.set(key, { label: skill, count: (counts.get(key)?.count || 0) + 1 });
    });
  });
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 6)
    .map((entry) => entry.label);
}

function scoreQuery(title: string, message: string): number {
  const text = normalize(message);
  const matches = (queryTerms[title] || []).filter((term) => text.includes(term)).length;
  return Math.min(matches * 10, 25);
}

function courseForSkills(missingSkills: string[]): RawCourse | undefined {
  const missing = new Set(missingSkills.map(normalize));
  return COURSES.map((course) => ({
    course,
    coverage: course.skills.filter((skill) => missing.has(normalize(skill))).length,
  }))
    .filter(({ coverage }) => coverage > 0)
    .sort((a, b) => b.coverage - a.coverage || a.course.name.localeCompare(b.course.name))[0]?.course;
}

function pathSummary(model: RawUser): string {
  const previousRoles = model.job_history
    .map((jobId) => jobsById.get(jobId)?.position)
    .filter(Boolean)
    .slice(0, 2) as string[];
  return previousRoles.length
    ? `${model.current_location} · experience in ${previousRoles.join(" and ")}`
    : `${model.current_location} · profile with similar skills`;
}

export function matchCareers(message: string, profile: MatchProfile): CareerMatch[] {
  const currentSkills = profile.skills;
  const titles = [...ROUTABLE];

  return titles
    .map((title) => {
      const roleModels = USERS.filter((user) => userHasRole(user, title));
      const roleSkills = mostCommonSkills(roleModels);
      const matchingSkills = overlap(currentSkills, roleSkills);
      const missingSkills = roleSkills.filter(
        (skill) => !matchingSkills.map(normalize).includes(normalize(skill))
      );
      const closestModel = [...roleModels]
        .map((model) => ({ model, sharedSkills: overlap(currentSkills, model.skills).length }))
        .sort((a, b) => b.sharedSkills - a.sharedSkills)[0]?.model;
      const course = courseForSkills(missingSkills);
      const skillScore = roleSkills.length
        ? Math.round((matchingSkills.length / roleSkills.length) * 65)
        : 0;
      const localScore =
        closestModel?.current_location === profile.current_location ? 10 : 0;
      const readiness = Math.min(94, Math.max(28, skillScore + scoreQuery(title, message) + localScore));

      return {
        title,
        readiness,
        currentSkills: matchingSkills.slice(0, 3),
        missingSkills: missingSkills.slice(0, 3),
        roleModelCount: roleModels.length,
        person: closestModel?.name || "LinkedIn member",
        path: closestModel ? pathSummary(closestModel) : "Similar profile in the sample data",
        initials:
          closestModel?.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2) || "LI",
        course: course
          ? `${course.name} · ${course.length.value} ${course.length.unit}`
          : "Explore courses in this skill area",
        matchReason: matchingSkills.length
          ? `${matchingSkills.length} skills already overlap with people who have held this role.`
          : "This is a discovery match based on your message; it opens a new skill neighborhood.",
      };
    })
    .sort((a, b) => b.readiness - a.readiness)
    .slice(0, 3);
}

export function profileCourses(profile: MatchProfile): string[] {
  return (profile.courses ?? [])
    .map((courseId) => courseById.get(courseId)?.name)
    .filter(Boolean) as string[];
}
