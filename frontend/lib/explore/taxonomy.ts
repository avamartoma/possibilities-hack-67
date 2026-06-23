// Taxonomy + mappings for the Explore page.
//   1. BUBBLES        — abstract the 21 industries into ~7 broad interest groups.
//   2. requiresDegree — which fields realistically need a college degree.
//   3. TITLE_TO_ROLE_ID — map a job title to a canonical roleSkills.json key so
//      the leaf can open the Comparison page. Only the 10 canonical roles are
//      wired today; the map grows as roleSkills.json grows.

import type { Bubble, JobPosition } from "./types";

/** Level 1 of the drill-down: broad, GenZ-friendly interest bubbles. */
export const BUBBLES: Bubble[] = [
  {
    id: "technical",
    label: "Technical & Building",
    emoji: "💻",
    industries: ["Technology", "Engineering", "Manufacturing"],
  },
  {
    id: "creative",
    label: "Creative & Media",
    emoji: "🎨",
    industries: ["Design", "Media & Entertainment"],
  },
  {
    id: "science",
    label: "Science & Discovery",
    emoji: "🔬",
    industries: ["Science & Research", "Biotech & Pharma", "Energy & Environment"],
  },
  {
    id: "aerospace",
    label: "Aerospace & Robotics",
    emoji: "🚀",
    industries: ["Aerospace"],
  },
  {
    id: "business",
    label: "Business & Money",
    emoji: "💼",
    industries: [
      "Product Management",
      "Finance",
      "Sales & Marketing",
      "Operations & Logistics",
      "Retail & E-commerce",
      "Human Resources",
    ],
  },
  {
    id: "people",
    label: "People & Care",
    emoji: "❤️",
    industries: ["Healthcare", "Education", "Customer Success"],
  },
  {
    id: "civic",
    label: "Law, Cities & Hospitality",
    emoji: "⚖️",
    industries: ["Legal", "Architecture & Construction", "Hospitality & Culinary"],
  },
];

/**
 * Industries where roles typically require a college degree. Fields not listed
 * (e.g. parts of Manufacturing, Hospitality, Retail, Customer Success) have
 * realistic no-degree entry paths, so they stay visible for users without one.
 */
const DEGREE_REQUIRED_INDUSTRIES = new Set<string>([
  "Technology",
  "Engineering",
  "Aerospace",
  "Science & Research",
  "Biotech & Pharma",
  "Healthcare",
  "Finance",
  "Legal",
  "Education",
  "Product Management",
  "Architecture & Construction",
  "Energy & Environment",
]);

/** Whether a position realistically requires a college degree. */
export function requiresDegree(position: JobPosition): boolean {
  return DEGREE_REQUIRED_INDUSTRIES.has(position.industry);
}

/**
 * Job title -> canonical roleSkills.json key. Only these have full fit data on
 * the Comparison page today; other titles show a graceful "coming soon" detail.
 */
export const TITLE_TO_ROLE_ID: Record<string, string> = {
  "Software Engineer": "software_engineer",
  "DevOps Engineer": "devops_engineer",
  "Data Scientist": "data_scientist",
  "UX Designer": "ux_designer",
  "Product Manager": "product_manager",
  "Financial Analyst": "financial_analyst",
  "Marketing Specialist": "marketing_specialist",
  "HR Coordinator": "hr_coordinator",
  "Sales Representative": "sales_representative",
  "Customer Service Manager": "customer_service_manager",
};

export function roleIdFor(position: JobPosition): string | null {
  return TITLE_TO_ROLE_ID[position.position] ?? null;
}
