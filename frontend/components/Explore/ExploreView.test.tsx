import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CareerRole } from "../../lib/types";

const searchRoles = vi.fn();
const recommendRoles = vi.fn();
vi.mock("../../lib/api", () => ({
  searchRoles: (...a: unknown[]) => searchRoles(...a),
  recommendRoles: (...a: unknown[]) => recommendRoles(...a),
}));
// Isolate ExploreView from the modal (RoleFifaCard has its own suite).
vi.mock("../RoleCard/RoleFifaCard", () => ({
  default: ({ roleId, onClose, onCompare }: any) => (
    <div>
      <span>modal:{roleId}</span>
      <button onClick={onClose}>modal-close</button>
      <button onClick={() => onCompare(roleId)}>modal-compare</button>
    </div>
  ),
}));

import ExploreView from "./ExploreView";

function role(id: string, name: string, jobCount = 5): CareerRole {
  return {
    id, name, category: "Tech", summary: "", requiredSkills: [], companies: [],
    salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true },
    jobCount, industries: [], levels: [],
  };
}

const NAMED = [role("data_scientist", "Data Scientist"), role("ux_designer", "UX Designer"), role("hr_coordinator", "HR Coordinator"), role("ops_lead", "Ops Lead", 1)];
const FILLER = Array.from({ length: 31 }, (_, i) => role(`r${i}`, `Role ${i}`));
const BIG_CATALOG = [...NAMED, ...FILLER]; // 35 roles

const noop = () => {};

beforeEach(() => {
  searchRoles.mockReset();
  recommendRoles.mockReset();
  searchRoles.mockResolvedValue({ roles: BIG_CATALOG });
  recommendRoles.mockResolvedValue({
    profileId: "user_2340",
    recommendations: [
      { role: role("data_scientist", "Data Scientist"), score: 9, readinessScore: 60, scoreReasons: [], matchedSkills: [] },
      { role: role("ux_designer", "UX Designer"), score: 5, readinessScore: 30, scoreReasons: [], matchedSkills: [] },
      { role: role("hr_coordinator", "HR Coordinator"), score: 2, readinessScore: 10, scoreReasons: [], matchedSkills: [] },
    ],
  });
});
afterEach(() => vi.clearAllMocks());

function setup(extra: Partial<{ onCompareRole: any; onOpenGuide: any }> = {}) {
  render(<ExploreView userId="user_2340" onCompareRole={extra.onCompareRole ?? noop} onOpenGuide={extra.onOpenGuide ?? noop} />);
}

describe("ExploreView (Discover)", () => {
  it("loads the catalog from the API on an empty query", async () => {
    setup();
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
    expect(searchRoles).toHaveBeenCalledWith({ query: "", categories: [], skills: [], limit: 100 });
    expect(screen.getByText("1 open role")).toBeInTheDocument(); // singular
    expect(screen.getAllByText(/5 open roles/).length).toBeGreaterThan(0); // plural
  });

  it("shows backend readiness badges (all bands) and '—' when absent", async () => {
    setup();
    expect(await screen.findByText("60%")).toBeInTheDocument();
    expect(screen.getByText("30%")).toBeInTheDocument();
    expect(screen.getByText("10%")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(recommendRoles).toHaveBeenCalledWith({ userId: "user_2340", limit: 20 });
  });

  it("paginates with Load more", async () => {
    setup();
    await screen.findByText("Data Scientist");
    expect(screen.queryByText("Role 30")).not.toBeInTheDocument(); // 35 roles, 30 shown
    await userEvent.click(screen.getByRole("button", { name: /Load more \(5 more\)/ }));
    expect(screen.getByText("Role 30")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Load more/ })).not.toBeInTheDocument();
  });

  it("sends one debounced search for a typed query", async () => {
    setup();
    await screen.findByText("Data Scientist");
    await userEvent.type(screen.getByLabelText("Search roles"), "data");
    await waitFor(() => expect(searchRoles.mock.calls.filter(([a]) => a.query === "data")).toHaveLength(1));
  });

  it("renders the no-results state", async () => {
    searchRoles.mockResolvedValue({ roles: [] });
    setup();
    expect(await screen.findByText(/No careers match/)).toBeInTheDocument();
  });

  it("renders an error with retry that repeats the request", async () => {
    searchRoles.mockRejectedValueOnce(new Error("x")).mockResolvedValue({ roles: BIG_CATALOG });
    setup();
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
  });

  it("opens the FIFA modal on card click and compares from it", async () => {
    const onCompareRole = vi.fn();
    setup({ onCompareRole });
    await userEvent.click(await screen.findByText("Data Scientist"));
    expect(screen.getByText("modal:data_scientist")).toBeInTheDocument();
    await userEvent.click(screen.getByText("modal-compare"));
    expect(onCompareRole).toHaveBeenCalledWith("data_scientist");
    expect(screen.queryByText("modal:data_scientist")).not.toBeInTheDocument(); // closes on compare
  });

  it("closes the modal without comparing", async () => {
    const onCompareRole = vi.fn();
    setup({ onCompareRole });
    await userEvent.click(await screen.findByText("UX Designer"));
    expect(screen.getByText("modal:ux_designer")).toBeInTheDocument();
    await userEvent.click(screen.getByText("modal-close"));
    expect(screen.queryByText("modal:ux_designer")).not.toBeInTheDocument();
    expect(onCompareRole).not.toHaveBeenCalled();
  });

  it("opens the Career Guide", async () => {
    const onOpenGuide = vi.fn();
    setup({ onOpenGuide });
    await userEvent.click(screen.getByRole("button", { name: /Open the Career Guide/ }));
    expect(onOpenGuide).toHaveBeenCalledOnce();
  });

  it("applies a hover lift to cards", async () => {
    setup();
    const card = (await screen.findByText("Data Scientist")).closest('[role="button"]') as HTMLElement;
    await userEvent.hover(card);
    expect(card.style.transform).toBe("translateY(-2px)");
    await userEvent.unhover(card);
    expect(card.style.transform).toBe("");
  });

  it("still renders when the readiness lookup fails", async () => {
    recommendRoles.mockRejectedValueOnce(new Error("no recs"));
    setup();
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
  });
});
