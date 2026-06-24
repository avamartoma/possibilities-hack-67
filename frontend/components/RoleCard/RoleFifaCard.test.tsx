import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleComparison } from "../../lib/types";

const compareRole = vi.fn();
vi.mock("../../lib/api", () => ({ compareRole: (...a: unknown[]) => compareRole(...a) }));

import RoleFifaCard from "./RoleFifaCard";

function comparison(over: Partial<RoleComparison> = {}): RoleComparison {
  return {
    profile: { id: "user_2340", name: "Bob", headline: "", currentStatus: "", skills: [], experience: [], education: [], interests: [], savedGoals: [], location: null },
    role: {
      id: "data_scientist", name: "Data Scientist", category: "Technology", summary: "", requiredSkills: [],
      salaryRange: { min: 100000, max: 150000, currency: "USD", isDemoGuidance: true },
      companies: ["Acme", "Globex"], jobCount: 2, industries: ["Technology"], levels: ["Senior"],
      postings: [
        { id: "job_1", company: "Acme", location: "Austin, TX", level: "Senior", salaryFrom: 100000, salaryTo: 150000, easyApply: true },
        { id: "job_2", company: "Globex", location: "NYC", level: "Mid", salaryFrom: 90000, salaryTo: 120000, easyApply: false },
      ],
    },
    readinessScore: 60,
    strengths: ["Python"],
    skillGaps: [
      { skill: "Machine Learning", status: "missing", importance: "core", evidence: [], recommendedCourse: null, suggestedProject: "Build a model" },
      { skill: "Python", status: "strength", importance: "core", evidence: ["Listed in your profile"], recommendedCourse: null, suggestedProject: null },
    ],
    suggestedNextSteps: [],
    aggregateAnalysis: { analyzed: 10, landed: 3, similar: 5 },
    ...over,
  };
}

const sparse = comparison({
  readinessScore: 0,
  strengths: [],
  skillGaps: [],
  role: { ...comparison().role, companies: [], postings: [], salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true } },
});

beforeEach(() => {
  compareRole.mockReset();
  compareRole.mockResolvedValue(comparison());
});
afterEach(() => vi.clearAllMocks());

const noop = () => {};

describe("RoleFifaCard", () => {
  it("loads via compareRole and renders the FIFA card detail", async () => {
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={noop} onCompare={noop} />);
    expect(screen.getByText("Loading role…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
    expect(compareRole).toHaveBeenCalledWith({ userId: "user_2340", roleId: "data_scientist" });
    expect(screen.getByText("60%")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument(); // owned
    expect(screen.getByText("Machine Learning")).toBeInTheDocument(); // missing
    expect(screen.getByText(/\$100,000–\$150,000/)).toBeInTheDocument();
    expect(screen.getByText(/Top companies:/)).toBeInTheDocument();
    expect(screen.getByTestId("postings-scroll")).toBeInTheDocument();
    expect(screen.getByText("Open roles (2)")).toBeInTheDocument();
  });

  it("fires onCompare with the role id from the CTA", async () => {
    const onCompare = vi.fn();
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={noop} onCompare={onCompare} />);
    await userEvent.click(await screen.findByRole("button", { name: "Compare your profile to this role" }));
    expect(onCompare).toHaveBeenCalledWith("data_scientist");
  });

  it("closes on Escape but ignores other keys", async () => {
    const onClose = vi.fn();
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={onClose} onCompare={noop} />);
    await screen.findByRole("dialog");
    fireEvent.keyDown(document, { key: "a" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("closes on backdrop click and the X button, but not on card click", async () => {
    const onClose = vi.fn();
    const { container } = render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={onClose} onCompare={noop} />);
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(dialog); // inside the card → no close
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(container.querySelector('[role="presentation"]')!); // backdrop
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("shows an error with retry that re-fetches", async () => {
    compareRole.mockRejectedValueOnce(new Error("down")).mockResolvedValue(comparison());
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={noop} onCompare={noop} />);
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
  });

  it("renders the empty/covered states for a sparse role", async () => {
    compareRole.mockResolvedValue(sparse);
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={noop} onCompare={noop} />);
    expect(await screen.findByText("New territory")).toBeInTheDocument();
    expect(screen.getByText("You’re covered")).toBeInTheDocument();
    expect(screen.getByText(/demo guidance only/)).toBeInTheDocument();
    expect(screen.queryByText(/Top companies:/)).not.toBeInTheDocument();
    expect(screen.getByText(/No live postings/)).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument(); // amber ring branch
  });

  it("handles a role with no postings field", async () => {
    const noPostings = comparison();
    delete (noPostings.role as { postings?: unknown }).postings;
    compareRole.mockResolvedValue(noPostings);
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={noop} onCompare={noop} />);
    expect(await screen.findByText("Open roles (0)")).toBeInTheDocument();
    expect(screen.getByText(/No live postings/)).toBeInTheDocument();
  });

  it("renders the mid-band ring color", async () => {
    compareRole.mockResolvedValue(comparison({ readinessScore: 30 })); // blue band branch
    render(<RoleFifaCard userId="user_2340" roleId="data_scientist" onClose={noop} onCompare={noop} />);
    expect(await screen.findByText("30%")).toBeInTheDocument();
  });
});
