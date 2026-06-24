import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import ComparisonPanel from "./ComparisonPanel";

const { compareRole } = vi.hoisted(() => ({ compareRole: vi.fn() }));
vi.mock("../../lib/api", () => ({ compareRole }));

const comparison = {
  role: { id: "data_scientist", name: "Data Scientist", summary: "Analyze data.", jobCount: 2, postings: [{ id: "j1", company: "Northstar", location: "Remote", level: "Entry", salaryFrom: 80000, salaryTo: 100000, easyApply: true }] },
  readinessScore: 57,
  readinessBreakdown: { core: { matched: 1, total: 2, points: 32 }, supporting: { matched: 1, total: 1, points: 20 }, evidence: { matched: 1, total: 3, points: 5 } },
  strengths: ["Python"], skillGaps: [{ skill: "Machine Learning", status: "missing" }], aggregateAnalysis: { analyzed: 2000, landed: 10, similar: 4 },
};

describe("ComparisonPanel", () => {
  beforeEach(() => { compareRole.mockResolvedValue(comparison); });
  it("renders Daniel's comparison content, explicit scoring, and path handoff", async () => {
    const onBuildPath = vi.fn(); render(<ComparisonPanel userId="user_2340" roleId="data_scientist" onBuildPath={onBuildPath} />);
    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
    expect(screen.getByText("Core skills")).toBeInTheDocument();
    expect(screen.getByText("1/2 · 32 pts")).toBeInTheDocument();
    expect(screen.getByText(/Northstar/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Build my path/ }));
    expect(onBuildPath).toHaveBeenCalledOnce();
  });
});
