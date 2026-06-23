// Shared data contract between backend (/api) and the Comparison Page.
// Keep in sync with backend/data/roleSkills.json and backend/fit.py.

export interface Role {
  id: string;
  name: string;
  category?: string;
  description: string;
  skills: string[];
  companies: string[];
}

export interface User {
  id: string;
  name: string;
  degree?: string;
  skills: string[];
  hero?: boolean;
  tagline?: string;
}

// Returned by GET /api/fit and by the client-side fallback (lib/fit.ts).
export interface FitResult {
  role: Pick<Role, "id" | "name" | "description" | "companies">;
  percent: number; // 0-100
  haveSkills: string[];
  missingSkills: string[];
}
