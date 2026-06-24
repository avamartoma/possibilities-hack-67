import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PersonalizedPath } from "../../lib/types";

const generatePath = vi.fn();
const getOpportunities = vi.fn();
vi.mock("../../lib/api", () => ({
  generatePath: (input: unknown) => generatePath(input),
  getOpportunities: (input: unknown) => getOpportunities(input),
}));

import MilestoneView from "./MilestoneView";

function path(overrides: Partial<PersonalizedPath> = {}): PersonalizedPath {
  return {
    profileId: "user_5329",
    role: {
      id: "data_scientist",
      name: "Data Scientist",
      category: "Tech",
      summary: "d",
      description: "d",
      requiredSkills: ["Python", "Machine Learning"],
      salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true },
      companies: [],
      jobCount: 0,
      industries: [],
      levels: [],
    },
    readinessScore: 40,
    startingStrengths: ["Python"],
    skillGaps: [],
    milestones: [
      {
        order: 1,
        title: "Build confidence in Machine Learning",
        targetSkill: "Machine Learning",
        reason: "Core skill not yet visible.",
        course: { id: "course_1", name: "Intro to ML", length: { value: 6, unit: "weeks" }, level: "Beginner" },
        project: "Build an ML demo project.",
        networkingAction: "Talk to a Data Scientist about ML.",
        profileCheckpoint: "Add an ML artifact to your profile.",
        completionState: "not_started",
      },
      {
        order: 2,
        title: "Build confidence in SQL",
        targetSkill: "SQL",
        reason: "Core skill not yet visible.",
        course: null,
        project: "Build a SQL analytics project.",
        networkingAction: "Talk to a Data Scientist about SQL.",
        profileCheckpoint: "Add a SQL artifact to your profile.",
        completionState: "not_started",
      },
    ],
    generatedAt: "2026-06-24T00:00:00Z",
    disclaimer: "Demo guidance.",
    ...overrides,
  };
}

beforeEach(() => {
  generatePath.mockReset();
  getOpportunities.mockReset();
  getOpportunities.mockResolvedValue({ profileId: "user_5329", total: 0, opportunities: [] });
});
afterEach(cleanup);

describe("MilestoneView", () => {
  it("shows a loading state and requests the path with the selected IDs", () => {
    generatePath.mockReturnValue(new Promise(() => {}));
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);
    expect(screen.getByText(/building/i)).toBeInTheDocument();
    expect(generatePath).toHaveBeenCalledWith({ userId: "user_5329", roleId: "data_scientist" });
  });

  it("renders ordered milestones with course, project, networking and checkpoint rows", async () => {
    generatePath.mockResolvedValue(path());
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);

    expect(await screen.findByText("Machine Learning")).toBeInTheDocument();
    // course object rendered.
    expect(screen.getByText(/Intro to ML/)).toBeInTheDocument();
    // all three action types present.
    expect(screen.getByText(/Build an ML demo project/)).toBeInTheDocument();
    expect(screen.getByText(/Talk to a Data Scientist about ML/)).toBeInTheDocument();
    expect(screen.getByText(/Add an ML artifact/)).toBeInTheDocument();
    // progress bar reflects readinessScore.
    expect(screen.getByText(/40% role readiness/)).toBeInTheDocument();
  });

  it("renders a milestone whose course is null without crashing", async () => {
    generatePath.mockResolvedValue(path());
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);
    expect(await screen.findByText(/Build a SQL analytics project/)).toBeInTheDocument();
  });

  it("toggles a milestone checkbox as local UI state only", async () => {
    generatePath.mockResolvedValue(path());
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);
    const firstTitle = await screen.findByText("Build confidence in Machine Learning");

    const checkbox = screen.getByRole("checkbox", { name: /Build confidence in Machine Learning/ });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    // local toggle never calls the backend again.
    expect(generatePath).toHaveBeenCalledTimes(1);

    expect(screen.getByRole("checkbox", { name: /Build confidence in SQL/ })).toBeInTheDocument();
  });

  it("uses plural skill-gap copy when more than one core skill is missing", async () => {
    generatePath.mockResolvedValue(
      path({
        skillGaps: [
          { skill: "SQL", status: "missing", importance: "core", evidence: [], recommendedCourse: null, suggestedProject: "p" },
          { skill: "Machine Learning", status: "missing", importance: "core", evidence: [], recommendedCourse: null, suggestedProject: "p" },
        ],
      })
    );
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);
    expect(await screen.findByText(/2 skills separate you/)).toBeInTheDocument();
  });

  it("shows the singular skill-gap copy and a course without a length", async () => {
    generatePath.mockResolvedValue(
      path({
        skillGaps: [
          { skill: "SQL", status: "missing", importance: "core", evidence: [], recommendedCourse: null, suggestedProject: "p" },
        ],
        milestones: [
          {
            order: 1,
            title: "Build confidence in SQL",
            targetSkill: "SQL",
            reason: "Core skill not yet visible.",
            course: { id: "course_2", name: "SQL Basics", level: "Beginner" },
            project: "Build a SQL project.",
            networkingAction: "Talk to a DS about SQL.",
            profileCheckpoint: "Add a SQL artifact.",
            completionState: "not_started",
          },
        ],
      })
    );
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);
    expect(await screen.findByText(/1 skill separate you/)).toBeInTheDocument();
    // course with no length renders just the name.
    expect(screen.getByText("SQL Basics")).toBeInTheDocument();
  });

  it("shows the fully-covered copy when there are no missing skill gaps", async () => {
    generatePath.mockResolvedValue(path({ skillGaps: [] }));
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);
    expect(await screen.findByText(/already covers the role's core skill set/)).toBeInTheDocument();
  });

  it("shows an error with a retry control that repeats the request", async () => {
    generatePath.mockRejectedValueOnce(new Error("boom"));
    render(<MilestoneView userId="user_5329" roleId="data_scientist" />);

    const retry = await screen.findByRole("button", { name: /retry/i });
    generatePath.mockResolvedValueOnce(path());
    await userEvent.click(retry);
    expect(await screen.findByText("Machine Learning")).toBeInTheDocument();
    expect(generatePath).toHaveBeenCalledTimes(2);
  });
});
