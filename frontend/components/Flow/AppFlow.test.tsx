import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getProfile = vi.fn();
vi.mock("../../lib/api", () => ({ getProfile: (...args: unknown[]) => getProfile(...args) }));

// Stub children so the coordinator's flow logic is tested in isolation. Each stub
// surfaces the selected ids and a button to fire its callback.
vi.mock("../Profile/ProfilePage", () => ({
  default: ({ profile, onLockIn }: any) => (
    <div>
      <span>profile:{profile.id}</span>
      <button onClick={onLockIn}>lock-in</button>
    </div>
  ),
}));
vi.mock("../Explore/ExploreView", () => ({
  default: ({ userId, onSelectRole }: any) => (
    <div>
      <span>explore:{userId}</span>
      <button onClick={() => onSelectRole("data_scientist")}>pick-role</button>
    </div>
  ),
}));
vi.mock("../Explain/ExplainView", () => ({
  default: ({ userId, roleId, onCompare }: any) => (
    <div>
      <span>explain:{userId}:{String(roleId)}</span>
      <button onClick={() => onCompare(roleId)}>compare</button>
    </div>
  ),
}));
vi.mock("../ComparisonPanel/ComparisonPanel", () => ({
  default: ({ userId, roleId, onBuildPath }: any) => (
    <div>
      <span>comparison:{userId}:{roleId}</span>
      <button onClick={() => onBuildPath({ missingSkills: [] })}>build-path</button>
    </div>
  ),
}));
vi.mock("../Milestone/MilestoneView", () => ({
  default: ({ userId, roleId }: any) => <span>milestone:{userId}:{roleId}</span>,
}));

import AppFlow, { DEFAULT_USER_ID } from "./AppFlow";

const profile = { id: DEFAULT_USER_ID, name: "Bob Smith" };

beforeEach(() => {
  getProfile.mockReset();
  getProfile.mockResolvedValue(profile);
});
afterEach(() => vi.clearAllMocks());

async function reachProfile() {
  render(<AppFlow />);
  expect(await screen.findByText(`profile:${DEFAULT_USER_ID}`)).toBeInTheDocument();
}

describe("AppFlow coordinator", () => {
  it("fetches the canonical profile on entry and shows a loading state first", async () => {
    let resolve: (v: unknown) => void = () => {};
    getProfile.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<AppFlow />);
    expect(screen.getByText(/Loading your profile/)).toBeInTheDocument();
    resolve(profile);
    expect(await screen.findByText(`profile:${DEFAULT_USER_ID}`)).toBeInTheDocument();
    expect(getProfile).toHaveBeenCalledWith(DEFAULT_USER_ID);
  });

  it("shows an error with retry when the profile fetch fails", async () => {
    getProfile.mockRejectedValueOnce(new Error("down"));
    render(<AppFlow />);
    const retry = await screen.findByRole("button", { name: "Retry" });
    await userEvent.click(retry);
    expect(await screen.findByText(`profile:${DEFAULT_USER_ID}`)).toBeInTheDocument();
  });

  it("walks landing → explore → explain → comparison → milestone carrying the role id", async () => {
    await reachProfile();
    await userEvent.click(screen.getByText("lock-in"));
    expect(screen.getByText(`explore:${DEFAULT_USER_ID}`)).toBeInTheDocument();

    await userEvent.click(screen.getByText("pick-role"));
    expect(screen.getByText(`explain:${DEFAULT_USER_ID}:data_scientist`)).toBeInTheDocument();

    await userEvent.click(screen.getByText("compare"));
    expect(screen.getByText(`comparison:${DEFAULT_USER_ID}:data_scientist`)).toBeInTheDocument();

    await userEvent.click(screen.getByText("build-path"));
    expect(screen.getByText(`milestone:${DEFAULT_USER_ID}:data_scientist`)).toBeInTheDocument();
  });

  it("keeps Back navigation deterministic and preserves the selected role", async () => {
    await reachProfile();
    await userEvent.click(screen.getByText("lock-in"));
    await userEvent.click(screen.getByText("pick-role")); // explain
    await userEvent.click(screen.getByText("compare")); // comparison
    await userEvent.click(screen.getByText("build-path")); // milestone

    await userEvent.click(screen.getByRole("button", { name: /Back to comparison/ }));
    expect(screen.getByText(`comparison:${DEFAULT_USER_ID}:data_scientist`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Back to Explain/ }));
    expect(screen.getByText(`explain:${DEFAULT_USER_ID}:data_scientist`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Back to Explore/ }));
    expect(screen.getByText(`explore:${DEFAULT_USER_ID}`)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Back to profile/ }));
    expect(screen.getByText(`profile:${DEFAULT_USER_ID}`)).toBeInTheDocument();
  });
});
