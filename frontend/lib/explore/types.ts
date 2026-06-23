// Types for the Explore page (Person A's slice).
// The drill-down is: interest Bubble -> Field (industry) -> JobPosition (leaf).
// Leaves hand off to the Comparison page (see lib/types.ts for that contract).

export type JobLevel = "Entry" | "Mid" | "Senior" | "Management";

/** A distinct job title, aggregated from sample_data/jobs_data.json. */
export interface JobPosition {
  position: string;
  industry: string;
  levels: JobLevel[]; // the levels this title is posted at, low -> high
  companies: string[];
  salary: { from: string; to: string };
}

/** Bundled, pre-aggregated catalog (frontend/data/jobsCatalog.json). */
export interface JobsCatalog {
  industries: string[];
  positions: JobPosition[];
}

/** One school_history entry, matching sample_data/user_data.json. */
export interface SchoolEntry {
  school_name: string;
  degree: string;
  graduation_year: number;
}

/**
 * A user profile in the user_data.json shape. Daniel's Comparison page is
 * moving to this same source, so the ids here resolve in /api/fit.
 */
export interface UserProfile {
  id: string;
  name: string;
  school_history: SchoolEntry[];
  job_history: string[];
  skills: string[];
  current_location?: string;
}

/** Profile signals derived once per user and used by the eligibility filter. */
export interface UserSignals {
  hasDegree: boolean;
  latestGradYear: number | null;
  isRecentGrad: boolean; // graduated within the last 4 years (or still a student)
  maxLevelRank: number; // 0=Entry .. 3=Management — highest level we surface
  fitCapable: boolean; // false for synthetic demo users not present in the fit dataset
}

/** A top-level interest bubble grouping one or more industries. */
export interface Bubble {
  id: string;
  label: string;
  emoji: string;
  industries: string[];
}

/** A field (industry) inside a bubble, with its eligible positions. */
export interface ExploreField {
  industry: string;
  positions: JobPosition[];
}
