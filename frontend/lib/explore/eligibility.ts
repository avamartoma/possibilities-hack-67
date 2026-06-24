// Eligibility: decides which job titles a given user actually sees in Explore.
//
// Two gates, per the product rules:
//   1. Seniority — if the user graduated within the last 4 years (or is still a
//      student), they aren't shown Senior/Management roles. A title is kept only
//      if it is posted at a level at or below the user's reachable level.
//   2. Degree — if a field requires a college degree and the user doesn't have
//      one, its titles are hidden.

import type { JobLevel, JobPosition, UserProfile, UserSignals } from "./types";
import { requiresDegree } from "./taxonomy";

export const LEVEL_RANK: Record<JobLevel, number> = {
  Entry: 0,
  Mid: 1,
  Senior: 2,
  Management: 3,
};

// "Last 4 years" is relative to the current year (2026 in the demo context).
const RECENT_GRAD_WINDOW = 4;

function currentYear(): number {
  return new Date().getFullYear();
}

/** Compute the eligibility signals for a user, once. */
export function deriveUserSignals(user: UserProfile): UserSignals {
  const gradYears = (user.school_history ?? [])
    .map((s) => s.graduation_year)
    .filter((y): y is number => typeof y === "number");

  const latestGradYear = gradYears.length ? Math.max(...gradYears) : null;
  const hasDegree = (user.school_history ?? []).some(
    (s) => !!s.degree && s.degree.trim().length > 0
  );

  // No graduation year at all -> treat as a student: recent, entry-level only.
  let isRecentGrad: boolean;
  let maxLevelRank: number;
  if (latestGradYear === null) {
    isRecentGrad = true;
    maxLevelRank = LEVEL_RANK.Entry;
  } else {
    isRecentGrad = currentYear() - latestGradYear <= RECENT_GRAD_WINDOW;
    // Recent grads aren't looking for senior positions -> cap at Mid.
    maxLevelRank = isRecentGrad ? LEVEL_RANK.Mid : LEVEL_RANK.Management;
  }

  // Synthetic demo users (not present in the fit dataset) can't get a real fit.
  const fitCapable = !user.id.startsWith("user_demo");

  return { hasDegree, latestGradYear, isRecentGrad, maxLevelRank, fitCapable };
}

/** Whether a job title should be shown to this user. */
export function isEligible(position: JobPosition, signals: UserSignals): boolean {
  const hasReachableLevel = position.levels.some(
    (l) => LEVEL_RANK[l] <= signals.maxLevelRank
  );
  const degreeOk = !requiresDegree(position) || signals.hasDegree;
  return hasReachableLevel && degreeOk;
}

/** Levels of a position that are actually reachable for this user (for display). */
export function reachableLevels(
  position: JobPosition,
  signals: UserSignals
): JobLevel[] {
  return position.levels.filter((l) => LEVEL_RANK[l] <= signals.maxLevelRank);
}
