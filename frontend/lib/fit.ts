// Client-side mirror of backend/fit.py::compute_fit.
// Flat skill-overlap: percent = |userSkills ∩ roleSkills| / |roleSkills|.
// Used as a fallback so the Comparison Page renders even if the backend is down.

import type { Role, FitResult } from "./types";

export function computeFit(userSkills: string[], role: Role): FitResult {
  const userSet = new Set(userSkills.map((s) => s.toLowerCase()));

  const have = role.skills
    .filter((s) => userSet.has(s.toLowerCase()))
    .sort();
  const missing = role.skills
    .filter((s) => !userSet.has(s.toLowerCase()))
    .sort();

  const percent =
    role.skills.length === 0
      ? 0
      : Math.round((100 * have.length) / role.skills.length);

  return {
    role: {
      id: role.id,
      name: role.name,
      description: role.description,
      companies: role.companies,
    },
    percent,
    haveSkills: have,
    missingSkills: missing,
  };
}
