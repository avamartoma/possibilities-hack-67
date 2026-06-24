// Shared data contract between backend (/api) and the Comparison Page.
// Keep in sync with backend/data/roleSkills.json (produced by backend/precompute.py
// from the real sample_data/ files) and backend/fit.py.

// A real job posting pulled from jobs_data.json.
export interface Posting {
  id: string;
  company: string;
  location: string;
  level: string;
  salaryFrom: number;
  salaryTo: number;
  easyApply: boolean; // REAL flag from jobs_data.json
}

export interface Role {
  id: string;
  name: string;
  category?: string;
  description: string;
  skills: string[];
  companies: string[];
  // Real fields derived from jobs_data.json by precompute.py:
  industries?: string[];
  levels?: string[];
  salaryFrom?: number;
  salaryTo?: number;
  easyApplyPct?: number;
  jobCount?: number;
  postings?: Posting[];
}

export interface User {
  id: string;
  name: string;
  degree?: string;
  skills: string[];
  hero?: boolean;
  tagline?: string;
}

// A real course pulled from course_data.json (for the gap / Milestone page).
export interface Course {
  id: string;
  name: string;
  length?: { value: number; unit: string };
  level?: string;
}

// Returned by GET /api/fit and by the client-side fallback (lib/fit.ts).
// Carries the real role enrichment so the panel can render salary, real
// postings, and the real easy-apply flag.
export interface FitResult {
  role: Pick<
    Role,
    | "id"
    | "name"
    | "description"
    | "companies"
    | "salaryFrom"
    | "salaryTo"
    | "easyApplyPct"
    | "jobCount"
    | "postings"
  >;
  percent: number; // 0-100
  haveSkills: string[];
  missingSkills: string[];
  analysis?: {
    analyzed: number;
    landed: number;
    similar: number;
  };
}

export interface MilestoneStep {
  step: number;
  skill: string;
  title: string;
  course: string | null;
  courseLength: { value: number; unit: string } | null;
  actions: string[];
}

export interface MilestonePlan {
  role: FitResult["role"];
  readiness: number;
  haveSkills: string[];
  missingSkills: string[];
  milestones: MilestoneStep[];
}

// V2 API contracts for the Profile -> Explore -> Compare -> Your Path flow.
export interface UserProfile {
  id: string;
  name: string;
  headline: string;
  currentStatus: string;
  skills: string[];
  experience: Record<string, unknown>[];
  education: Record<string, unknown>[];
  interests: string[];
  savedGoals: string[];
  location: string | null;
}

export interface ProfileOverride extends Partial<Omit<UserProfile, "id" | "name">> {}

export interface CareerRole {
  id: string;
  name: string;
  category: string;
  summary: string;
  description?: string;
  requiredSkills: string[];
  relatedRoleIds?: string[];
  dayToDay?: string[];
  commonPaths?: string[];
  salaryRange: { min: number | null; max: number | null; currency: string; isDemoGuidance: boolean };
  companies: string[];
  postings?: Posting[];
  jobCount: number;
  industries: string[];
  levels: string[];
}

export interface RoleRecommendation {
  role: CareerRole;
  score: number;
  // Distinct from the ranking `score`: 0-100 readiness from role skills ∩ profile skills.
  readinessScore: number;
  scoreReasons: string[];
  matchedSkills: string[];
}

export interface RoleComparison {
  profile: UserProfile;
  role: CareerRole;
  readinessScore: number;
  strengths: string[];
  skillGaps: Array<{ skill: string; status: "strength" | "missing" | "adjacent"; importance: "core" | "supporting"; evidence: string[]; recommendedCourse: Course | null; suggestedProject: string | null }>;
  suggestedNextSteps: string[];
  aggregateAnalysis: { analyzed: number; landed: number; similar: number };
}

export interface RoleExplanation {
  role: CareerRole;
  plainLanguageSummary: string;
  dayToDay: string[];
  coreSkills: string[];
  commonPaths: string[];
  relatedRoles: CareerRole[];
  salaryRange: CareerRole["salaryRange"];
  whyItMayFit: string;
  disclaimer: string;
}

export interface PersonalizedPath {
  profileId: string;
  role: CareerRole;
  readinessScore: number;
  startingStrengths: string[];
  skillGaps: RoleComparison["skillGaps"];
  milestones: Array<{ order: number; title: string; targetSkill: string; reason: string; course: Course | null; project: string; networkingAction: string; profileCheckpoint: string; completionState: "not_started" }>;
  generatedAt: string;
  disclaimer: string;
}
