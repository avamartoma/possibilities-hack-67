// Data access for the Explore page.
//
// Catalog is always bundled (pre-aggregated from sample_data/jobs_data.json).
// Users: try the shared /api/users endpoint first (Daniel's backend is moving
// to user_data.json), and fall back to the bundled demo profiles so the page
// renders standalone — same "demo never breaks" pattern as lib/api.ts.

import type { JobsCatalog, UserProfile } from "./types";
import catalogData from "../../data/jobsCatalog.json";
import exploreUsers from "../../data/exploreUsers.json";

const CATALOG = catalogData as unknown as JobsCatalog;
const BUNDLED_USERS = exploreUsers as unknown as UserProfile[];

export function getCatalog(): JobsCatalog {
  return CATALOG;
}

/**
 * The demo profiles shown in the "View as" picker. These are curated to show
 * the eligibility filter clearly (a recent grad, an experienced user, and a
 * no-degree student). The non-synthetic ids are real user_data.json ids, so
 * the Comparison page's fit resolves once its backend reads user_data.json.
 */
export function getUsers(): UserProfile[] {
  return BUNDLED_USERS;
}
