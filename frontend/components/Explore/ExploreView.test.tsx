import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CareerRole } from "../../lib/types";

const searchRoles = vi.fn();
const recommendRoles = vi.fn();
vi.mock("../../lib/api", () => ({
  searchRoles: (...a: unknown[]) => searchRoles(...a),
  recommendRoles: (...a: unknown[]) => recommendRoles(...a),
}));

import ExploreView from "./ExploreView";

function role(id: string, name: string, category = "Tech"): CareerRole {
  return {
    id, name, category, summary: "", requiredSkills: [], companies: ["Acme", "Globex", "Initech", "Hooli"],
    salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true },
    jobCount: 10, industries: [], levels: [],
  };
}

const CATALOG = [role("data_scientist", "Data Scientist"), role("ux_designer", "UX Designer"), role("hr_coordinator", "HR Coordinator"), role("new_role", "New Role")];

beforeEach(() => {
  searchRoles.mockReset();
  recommendRoles.mockReset();
  searchRoles.mockResolvedValue({ roles: CATALOG });
  // Backend readiness — drives every badge branch; "new_role" is absent (undefined badge).
  recommendRoles.mockResolvedValue({
    profileId: "user_2340",
    recommendations: [
      { role: role("data_scientist", "Data Scientist"), score: 9, readinessScore: 60, scoreReasons: [], matchedSkills: ["Python"] },
      { role: role("ux_designer", "UX Designer"), score: 5, readinessScore: 30, scoreReasons: [], matchedSkills: [] },
      { role: role("hr_coordinator", "HR Coordinator"), score: 2, readinessScore: 10, scoreReasons: [], matchedSkills: [] },
    ],
  });
});
afterEach(() => vi.clearAllMocks());

describe("ExploreView", () => {
  it("renders the catalog from the API on an empty query", async () => {
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
    expect(searchRoles).toHaveBeenCalledWith({ query: "", categories: [], skills: [], limit: 20 });
  });

  it("shows backend readiness on cards and never computes fit locally", async () => {
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    // 60 (green), 30 (blue), 10 (amber), undefined ("—") — all badge branches.
    expect(await screen.findByText("60%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(recommendRoles).toHaveBeenCalledWith({ userId: "user_2340", limit: 20 });
  });

  it("sends one debounced search for a typed query and renders the match", async () => {
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    await screen.findByText("Data Scientist");
    await userEvent.type(screen.getByLabelText("Search roles"), "data");
    await waitFor(() => {
      expect(searchRoles.mock.calls.filter(([arg]) => arg.query === "data")).toHaveLength(1);
    });
  });

  it("renders the no-results state for an empty result set", async () => {
    searchRoles.mockResolvedValue({ roles: [] });
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    expect(await screen.findByText(/No careers match/)).toBeInTheDocument();
  });

  it("renders an error with a retry control that repeats the request", async () => {
    searchRoles.mockRejectedValueOnce(new Error("boom")).mockResolvedValue({ roles: CATALOG });
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    const retry = await screen.findByRole("button", { name: "Retry" });
    await userEvent.click(retry);
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
  });

  it("hands the canonical role id to AppFlow on card selection", async () => {
    const onSelectRole = vi.fn();
    render(<ExploreView userId="user_2340" onSelectRole={onSelectRole} />);
    await userEvent.click(await screen.findByText("Data Scientist"));
    expect(onSelectRole).toHaveBeenCalledWith("data_scientist");
  });

  it("applies a hover lift to cards", async () => {
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    const card = (await screen.findByText("Data Scientist")).closest('[role="button"]') as HTMLElement;
    await userEvent.hover(card);
    expect(card.style.transform).toBe("translateY(-2px)");
    await userEvent.unhover(card);
    expect(card.style.transform).toBe("");
  });

  it("still renders cards when the readiness lookup fails", async () => {
    recommendRoles.mockRejectedValueOnce(new Error("no recs"));
    render(<ExploreView userId="user_2340" onSelectRole={() => {}} />);
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
