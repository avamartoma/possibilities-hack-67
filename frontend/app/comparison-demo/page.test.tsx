import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Role, RoleComparison, User } from "../../lib/types";

const getRoles = vi.fn();
const getUsers = vi.fn();
const compareRole = vi.fn();

vi.mock("../../lib/api", () => ({
  getRoles: () => getRoles(),
  getUsers: () => getUsers(),
  compareRole: (input: unknown) => compareRole(input),
}));

import Page from "./page";

const ROLES: Role[] = [
  { id: "data_scientist", name: "Data Scientist", category: "Tech", description: "d", skills: ["Python"], companies: [] },
  { id: "ux_designer", name: "UX Designer", category: "Design", description: "d", skills: ["Figma"], companies: [] },
];
const USERS: User[] = [
  { id: "user_5329", name: "Hero User", skills: ["Python"], hero: true, tagline: "Exploring", degree: "BS Computer Science" },
  { id: "user_1", name: "Other User", skills: [] },
];

function comparison(): RoleComparison {
  return {
    profile: { id: "user_5329", name: "Hero", headline: "h", currentStatus: "s", skills: ["Python"], experience: [], education: [], interests: [], savedGoals: [], location: null },
    role: { id: "data_scientist", name: "Data Scientist", category: "Tech", summary: "d", description: "d", requiredSkills: ["Python"], salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true }, companies: [], postings: [], jobCount: 0, industries: [], levels: [] },
    readinessScore: 100,
    strengths: ["Python"],
    skillGaps: [],
    suggestedNextSteps: ["Go"],
    aggregateAnalysis: { analyzed: 1, landed: 0, similar: 0 },
  };
}

beforeEach(() => {
  getRoles.mockReset();
  getUsers.mockReset();
  compareRole.mockReset();
  getRoles.mockResolvedValue(ROLES);
  getUsers.mockResolvedValue(USERS);
  compareRole.mockResolvedValue(comparison());
});
afterEach(cleanup);

describe("comparison-demo page", () => {
  it("mounts, defaults to the hero user, and wires ComparisonPanel", async () => {
    render(<Page />);
    // ComparisonPanel renders once the default user + role resolve.
    expect(await screen.findByRole("heading", { name: "Data Scientist" })).toBeInTheDocument();
    expect(compareRole).toHaveBeenCalledWith({ userId: "user_5329", roleId: "data_scientist" });
    // Identity card shows the hero user's tagline + degree.
    expect(screen.getByText(/Exploring/)).toBeInTheDocument();
    expect(screen.getByText(/BS Computer Science/)).toBeInTheDocument();
  });

  it("re-compares when the user picker changes the active user", async () => {
    render(<Page />);
    await screen.findByRole("heading", { name: "Data Scientist" });
    await userEvent.selectOptions(screen.getByRole("combobox"), "user_1");
    await waitFor(() => expect(compareRole).toHaveBeenCalledWith({ userId: "user_1", roleId: "data_scientist" }));
  });

  it("filters the role list as the user types and switches the selected role", async () => {
    render(<Page />);
    await screen.findByRole("heading", { name: "Data Scientist" });

    const search = screen.getByLabelText(/search roles/i);
    await userEvent.type(search, "ux");
    // Data Scientist filtered out of the rail; UX Designer remains selectable.
    const uxButton = await screen.findByRole("button", { name: /UX Designer/ });
    await userEvent.click(uxButton);
    await waitFor(() => expect(compareRole).toHaveBeenCalledWith({ userId: "user_5329", roleId: "ux_designer" }));
  });

  it("shows the no-results state when the query matches nothing", async () => {
    render(<Page />);
    await screen.findByRole("heading", { name: "Data Scientist" });
    await userEvent.type(screen.getByLabelText(/search roles/i), "zzzzz");
    expect(await screen.findByText(/No roles match/i)).toBeInTheDocument();
  });

  it("matches a category-less role by skill and falls back to the first user when none is hero", async () => {
    getUsers.mockResolvedValue([{ id: "user_1", name: "Only User", skills: [] }]);
    getRoles.mockResolvedValue([
      { id: "data_scientist", name: "Data Scientist", description: "d", skills: ["Python"], companies: [] },
      { id: "ux_designer", name: "UX Designer", description: "d", skills: ["Figma"], companies: [] },
    ]);
    render(<Page />);
    await waitFor(() => expect(compareRole).toHaveBeenCalledWith({ userId: "user_1", roleId: "data_scientist" }));
    // Search by a skill ("figma") on roles that carry no category field.
    await userEvent.type(screen.getByLabelText(/search roles/i), "figma");
    expect(await screen.findByRole("button", { name: /UX Designer/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Data Scientist/ })).not.toBeInTheDocument();
  });

  it("handles empty role and user collections without crashing", async () => {
    getUsers.mockResolvedValue([]);
    getRoles.mockResolvedValue([]);
    render(<Page />);
    expect(await screen.findByText(/Explore roles/i)).toBeInTheDocument();
    expect(compareRole).not.toHaveBeenCalled();
  });
});
