import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RoleComparison } from "../../lib/types";

const compareRole = vi.fn();
vi.mock("../../lib/api", () => ({
  compareRole: (input: unknown) => compareRole(input),
}));

import ComparisonPanel from "./ComparisonPanel";

function comparison(overrides: Partial<RoleComparison> = {}): RoleComparison {
  return {
    profile: {
      id: "user_5329",
      name: "Test User",
      headline: "h",
      currentStatus: "s",
      skills: ["Python"],
      experience: [],
      education: [],
      interests: [],
      savedGoals: [],
      location: null,
    },
    role: {
      id: "data_scientist",
      name: "Data Scientist",
      category: "Tech",
      summary: "Turns data into decisions.",
      description: "Turns data into decisions.",
      requiredSkills: ["Python", "Machine Learning"],
      salaryRange: { min: 90000, max: 150000, currency: "USD", isDemoGuidance: true },
      companies: ["Acme"],
      postings: [
        { id: "job_1", company: "Acme", location: "NYC", level: "Senior", salaryFrom: 90000, salaryTo: 150000, easyApply: true },
        { id: "job_2", company: "Globex", location: "SF", level: "Mid", salaryFrom: 80000, salaryTo: 120000, easyApply: false },
      ],
      jobCount: 12,
      industries: ["Tech"],
      levels: ["Senior"],
    },
    readinessScore: 50,
    strengths: ["Python"],
    skillGaps: [
      { skill: "Python", status: "strength", importance: "core", evidence: ["Listed in your profile"], recommendedCourse: null, suggestedProject: null },
      { skill: "Machine Learning", status: "missing", importance: "core", evidence: [], recommendedCourse: null, suggestedProject: "Build an ML demo." },
    ],
    suggestedNextSteps: ["Build evidence in Machine Learning"],
    aggregateAnalysis: { analyzed: 100, landed: 10, similar: 4 },
    ...overrides,
  };
}

beforeEach(() => {
  compareRole.mockReset();
});
afterEach(cleanup);

describe("ComparisonPanel", () => {
  it("shows a loading state before the comparison resolves", () => {
    compareRole.mockReturnValue(new Promise(() => {}));
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(compareRole).toHaveBeenCalledWith({ userId: "user_5329", roleId: "data_scientist" });
  });

  it("renders readiness, strengths, missing gaps, postings and aggregate on success", async () => {
    compareRole.mockResolvedValue(comparison());
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" />);

    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
    // readinessScore drives the ring.
    expect(screen.getByText("50%")).toBeInTheDocument();
    // strength present, missing gap present, strength-only skill not shown as a gap.
    expect(screen.getAllByText("Python").length).toBeGreaterThan(0);
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
    // real posting from backend.
    expect(screen.getByText(/Acme/)).toBeInTheDocument();
    // aggregate counts only.
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });

  it("shows an error with a retry control that repeats the request", async () => {
    compareRole.mockRejectedValueOnce(new Error("boom"));
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" />);

    const retry = await screen.findByRole("button", { name: /retry/i });
    expect(screen.getByText(/couldn.t load|error|try again/i)).toBeInTheDocument();

    compareRole.mockResolvedValueOnce(comparison());
    await userEvent.click(retry);
    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
    expect(compareRole).toHaveBeenCalledTimes(2);
  });

  it("shows the strong-applicant treatment and singular aggregate when readiness is high", async () => {
    compareRole.mockResolvedValue(
      comparison({ readinessScore: 80, aggregateAnalysis: { analyzed: 100, landed: 10, similar: 0 } })
    );
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" />);
    expect(await screen.findByText(/top applicant/i)).toBeInTheDocument();
    expect(screen.getAllByText(/strong applicant/i).length).toBeGreaterThan(0);
    // similar:0 → no "share at least one skill" clause.
    expect(screen.queryByText(/share at least one skill/i)).not.toBeInTheDocument();
  });

  it("renders without postings or a job count", async () => {
    const base = comparison();
    const role = { ...base.role };
    delete (role as { postings?: unknown }).postings;
    delete (role as { jobCount?: unknown }).jobCount;
    compareRole.mockResolvedValue({ ...base, role });
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" />);
    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
    expect(screen.queryByText(/open$/)).not.toBeInTheDocument();
  });

  it("falls back to logging when no Build Path callback is provided", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    compareRole.mockResolvedValue(comparison());
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" />);
    await userEvent.click(await screen.findByRole("button", { name: /build my path/i }));
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("passes the selected user and role IDs to the Build Path callback", async () => {
    const onBuildPath = vi.fn();
    compareRole.mockResolvedValue(comparison());
    render(<ComparisonPanel userId="user_5329" roleId="data_scientist" onBuildPath={onBuildPath} />);

    const build = await screen.findByRole("button", { name: /build my path/i });
    await userEvent.click(build);
    const payload = onBuildPath.mock.calls[0][0];
    expect(payload.userId).toBe("user_5329");
    expect(payload.roleId).toBe("data_scientist");
  });
});
