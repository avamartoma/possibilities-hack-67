// Builds the drill-down structure from the catalog, applying the per-user
// eligibility filter so each user sees only the roles open to them.

import type {
  Bubble,
  ExploreField,
  JobsCatalog,
  JobPosition,
  UserSignals,
} from "./types";
import { isEligible } from "./eligibility";

/** Eligible positions in an industry, sorted by title. */
function eligiblePositionsInIndustry(
  catalog: JobsCatalog,
  industry: string,
  signals: UserSignals
): JobPosition[] {
  return catalog.positions
    .filter((p) => p.industry === industry && isEligible(p, signals))
    .sort((a, b) => a.position.localeCompare(b.position));
}

/** Fields (industries) inside a bubble that still have at least one eligible role. */
export function fieldsForBubble(
  catalog: JobsCatalog,
  bubble: Bubble,
  signals: UserSignals
): ExploreField[] {
  return bubble.industries
    .map((industry) => ({
      industry,
      positions: eligiblePositionsInIndustry(catalog, industry, signals),
    }))
    .filter((f) => f.positions.length > 0)
    .sort((a, b) => a.industry.localeCompare(b.industry));
}

/** Total eligible roles in a bubble — used for the bubble's count badge. */
export function eligibleCountForBubble(
  catalog: JobsCatalog,
  bubble: Bubble,
  signals: UserSignals
): number {
  return fieldsForBubble(catalog, bubble, signals).reduce(
    (sum, f) => sum + f.positions.length,
    0
  );
}
