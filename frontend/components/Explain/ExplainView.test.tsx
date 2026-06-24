import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ExploreRole, RoleRecommendation } from "../../lib/types";

const recommendRoles = vi.fn();
const exploreBreadth = vi.fn();
vi.mock("../../lib/api", () => ({
  recommendRoles: (...a: unknown[]) => recommendRoles(...a),
  exploreBreadth: (...a: unknown[]) => exploreBreadth(...a),
}));
vi.mock("../RoleCard/RoleFifaCard", () => ({
  default: ({ roleId, onClose, onCompare }: any) => (
    <div>
      <span>modal:{roleId}</span>
      <button onClick={onClose}>modal-close</button>
      <button onClick={() => onCompare(roleId)}>modal-compare</button>
    </div>
  ),
}));

import ExplainView from "./ExplainView";

function careerRole(id: string, name: string): any {
  return { id, name, category: "Tech", summary: "", requiredSkills: [], salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true }, companies: [], jobCount: 0, industries: [], levels: [] };
}
const TOP_JOBS: ExploreRole[] = [{ role: careerRole("data_scientist", "Data Scientist"), readinessScore: 30, exploreReason: "New industry: Technology" }, { role: careerRole("ux_designer", "UX Designer"), readinessScore: 25, exploreReason: "Stretch: 25% readiness" }];
const RECS: RoleRecommendation[] = [
  { role: careerRole("data_scientist", "Data Scientist"), score: 9, readinessScore: 60, scoreReasons: ["Matches Python"], matchedSkills: ["Python"] },
  { role: careerRole("ux_designer", "UX Designer"), score: 3, readinessScore: 0, scoreReasons: ["Adjacent role to explore"], matchedSkills: [] },
];

beforeEach(() => {
  recommendRoles.mockReset();
  exploreBreadth.mockReset();
  recommendRoles.mockResolvedValue({ profileId: "user_2340", recommendations: RECS });
  exploreBreadth.mockResolvedValue({ profileId: "user_2340", exploratoryRoles: TOP_JOBS });
});
afterEach(() => vi.clearAllMocks());

const noop = () => {};

describe("ExplainView (Career Guide)", () => {
  it("loads the curiosity rail on entry", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    expect(screen.getByText(/Finding a few directions/)).toBeInTheDocument();
    expect(await screen.findByText("Data Scientist")).toBeInTheDocument();
    expect(exploreBreadth).toHaveBeenCalledWith({ userId: "user_2340", limit: 12 });
    expect(screen.getByText("New industry: Technology")).toBeInTheDocument();
    expect(screen.getByTestId("curiosity-scroll")).toBeInTheDocument();
  });

  it("opens the modal from a top-applicant job and compares from it", async () => {
    const onCompare = vi.fn();
    render(<ExplainView userId="user_2340" onCompare={onCompare} />);
    const acme = (await screen.findAllByText("Data Scientist"))[0].closest("article")!;
    await userEvent.click(within(acme).getByRole("button", { name: /Explore this role/ }));
    expect(screen.getByText("modal:data_scientist")).toBeInTheDocument();
    await userEvent.click(screen.getByText("modal-compare"));
    expect(onCompare).toHaveBeenCalledWith("data_scientist");
    expect(screen.queryByText("modal:data_scientist")).not.toBeInTheDocument();
  });

  it("shows empty and error+retry states for the scroller", async () => {
    exploreBreadth.mockResolvedValueOnce({ profileId: "user_2340", exploratoryRoles: [] });
    const { unmount } = render(<ExplainView userId="user_2340" onCompare={noop} />);
    expect(await screen.findByText(/No curiosity roles yet/)).toBeInTheDocument();
    unmount();

    exploreBreadth.mockRejectedValueOnce(new Error("down")).mockResolvedValue({ profileId: "user_2340", exploratoryRoles: TOP_JOBS });
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect((await screen.findAllByText("Data Scientist")).length).toBeGreaterThan(0);
  });

  it("submits the prompt and renders score reasons + matched skills", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("New industry: Technology");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data work");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(recommendRoles).toHaveBeenCalledWith({ userId: "user_2340", query: "data work", interests: [], limit: 3 });
    expect(await screen.findByText("Matches Python")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("New territory")).toBeInTheDocument();
  });

  it("shows a loading state while recommendations resolve", async () => {
    let resolve: (v: unknown) => void = () => {};
    recommendRoles.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("New industry: Technology");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(screen.getByText(/Matching skills/)).toBeInTheDocument();
    resolve({ profileId: "user_2340", recommendations: RECS });
    expect(await screen.findByText("Matches Python")).toBeInTheDocument();
  });

  it("opens the modal from a recommendation", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("New industry: Technology");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    const recCard = (await screen.findAllByText("Data Scientist"))[1].closest("article")!;
    await userEvent.click(within(recCard).getByRole("button", { name: /Explore this role/ }));
    expect(screen.getByText("modal:data_scientist")).toBeInTheDocument();
    await userEvent.click(screen.getByText("modal-close"));
    expect(screen.queryByText("modal:data_scientist")).not.toBeInTheDocument();
  });

  it("fills the prompt from a suggested chip", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await userEvent.click(screen.getByRole("button", { name: /I like AI but do not want to code/ }));
    expect((screen.getByLabelText("Career prompt") as HTMLTextAreaElement).value).toMatch(/I like AI/);
  });

  it("ignores an empty prompt submission", async () => {
    const { container } = render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("New industry: Technology");
    fireEvent.submit(container.querySelector('form[aria-label="career prompt"]')!);
    expect(recommendRoles).not.toHaveBeenCalled();
  });

  it("renders empty and error recommendation states", async () => {
    recommendRoles.mockResolvedValueOnce({ profileId: "user_2340", recommendations: [] });
    const { unmount } = render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("New industry: Technology");
    await userEvent.type(screen.getByLabelText("Career prompt"), "zzz");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(await screen.findByText(/No roles matched/)).toBeInTheDocument();
    unmount();

    recommendRoles.mockRejectedValueOnce(new Error("down"));
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("New industry: Technology");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(await screen.findByText(/Couldn’t fetch recommendations/)).toBeInTheDocument();
  });
});
