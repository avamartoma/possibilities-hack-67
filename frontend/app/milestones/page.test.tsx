import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { PersonalizedPath } from "../../lib/types";

const generatePath = vi.fn();
const getOpportunities = vi.fn();
vi.mock("../../lib/api", () => ({
  generatePath: (input: unknown) => generatePath(input),
  getOpportunities: (input: unknown) => getOpportunities(input),
}));

import Page from "./page";
import { resolveSelection } from "./selection";

function path(): PersonalizedPath {
  return {
    profileId: "user_2340",
    role: { id: "ux_designer", name: "UX Designer", category: "Design", summary: "d", description: "d", requiredSkills: ["Figma"], salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true }, companies: [], jobCount: 0, industries: [], levels: [] },
    readinessScore: 25,
    startingStrengths: [],
    skillGaps: [{ skill: "Figma", status: "missing", importance: "core", evidence: [], recommendedCourse: null, suggestedProject: "p" }],
    milestones: [
      { order: 1, title: "Build confidence in Figma", targetSkill: "Figma", reason: "r", course: null, project: "Build a Figma project.", networkingAction: "Talk to a designer.", profileCheckpoint: "Add a Figma artifact.", completionState: "not_started" },
    ],
    generatedAt: "2026-06-24T00:00:00Z",
    disclaimer: "Demo guidance.",
  };
}

beforeEach(() => {
  generatePath.mockReset();
  generatePath.mockResolvedValue(path());
  getOpportunities.mockResolvedValue({ profileId: "user_2340", total: 0, opportunities: [] });
  window.history.replaceState({}, "", "/milestones?user=user_2340&role=ux_designer");
});
afterEach(cleanup);

describe("milestones page", () => {
  it("mounts and wires MilestoneView with the URL user/role params", async () => {
    render(<Page />);
    expect(await screen.findByText(/Progress toward UX Designer/)).toBeInTheDocument();
    expect(generatePath).toHaveBeenCalledWith({ userId: "user_2340", roleId: "ux_designer" });
  });

  it("defaults to the canonical user and role when no params are present", async () => {
    window.history.replaceState({}, "", "/milestones");
    render(<Page />);
    await screen.findByText(/building/i);
    expect(generatePath).toHaveBeenCalledWith({ userId: "user_2340", roleId: "data_scientist" });
  });

  it("resolveSelection falls back to canonical defaults for the SSR (null) case", () => {
    expect(resolveSelection(null)).toEqual({ userId: "user_2340", roleId: "data_scientist" });
    expect(resolveSelection("?user=user_5329&role=ux_designer")).toEqual({ userId: "user_5329", roleId: "ux_designer" });
  });
});
