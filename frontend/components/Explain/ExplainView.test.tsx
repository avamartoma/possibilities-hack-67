import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleExplanation, RoleRecommendation } from "../../lib/types";

const explainRole = vi.fn();
const recommendRoles = vi.fn();
vi.mock("../../lib/api", () => ({
  explainRole: (...a: unknown[]) => explainRole(...a),
  recommendRoles: (...a: unknown[]) => recommendRoles(...a),
}));

import ExplainView from "./ExplainView";

function careerRole(id: string, name: string): any {
  return { id, name, category: "Tech", summary: "", requiredSkills: [], salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true }, companies: [], jobCount: 0, industries: [], levels: [] };
}

const richExplanation: RoleExplanation = {
  role: careerRole("data_scientist", "Data Scientist"),
  plainLanguageSummary: "Turn data into decisions.",
  dayToDay: ["Clean data", "Build models"],
  coreSkills: ["Python", "Statistics"],
  commonPaths: ["Analyst → DS"],
  relatedRoles: [careerRole("ml_engineer", "ML Engineer")],
  salaryRange: { min: 100000, max: 150000, currency: "USD", isDemoGuidance: true },
  whyItMayFit: "You already have signal in Python.",
  disclaimer: "Demo guidance based on seeded data.",
};

const sparseExplanation: RoleExplanation = {
  ...richExplanation,
  relatedRoles: [],
  salaryRange: { min: null, max: null, currency: "USD", isDemoGuidance: true },
};

const recommendations: RoleRecommendation[] = [
  { role: careerRole("data_scientist", "Data Scientist"), score: 9, readinessScore: 60, scoreReasons: ["Matches Python"], matchedSkills: ["Python"] },
  { role: careerRole("ux_designer", "UX Designer"), score: 3, readinessScore: 0, scoreReasons: ["Adjacent role to explore"], matchedSkills: [] },
];

beforeEach(() => {
  explainRole.mockReset();
  recommendRoles.mockReset();
  explainRole.mockResolvedValue(richExplanation);
  recommendRoles.mockResolvedValue({ profileId: "user_2340", recommendations });
});
afterEach(() => vi.clearAllMocks());

describe("ExplainView", () => {
  it("auto-explains the role carried in from Explore and hands it to Compare", async () => {
    const onCompare = vi.fn();
    render(<ExplainView userId="user_2340" roleId="data_scientist" onCompare={onCompare} />);
    await waitFor(() => expect(explainRole).toHaveBeenCalledWith({ roleId: "data_scientist", userId: "user_2340" }));
    expect(await screen.findByText("Build models")).toBeInTheDocument(); // day-to-day
    expect(screen.getByText(/Why it may fit/)).toBeInTheDocument();
    expect(screen.getByText(/\$100,000–\$150,000/)).toBeInTheDocument();
    expect(screen.getByText(/Related:/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Compare your profile to this role" }));
    expect(onCompare).toHaveBeenCalledWith("data_scientist");
  });

  it("renders no explanation panel when no role is carried in", () => {
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    expect(explainRole).not.toHaveBeenCalled();
    expect(screen.queryByText(/Compare your profile to this role/)).not.toBeInTheDocument();
  });

  it("submits the prompt to recommendRoles and renders score reasons + matched skills", async () => {
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    await userEvent.type(screen.getByLabelText("Career prompt"), "data work");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(recommendRoles).toHaveBeenCalledWith({ userId: "user_2340", query: "data work", interests: [], limit: 3 });
    expect(await screen.findByText("Matches Python")).toBeInTheDocument();
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("New territory")).toBeInTheDocument(); // empty matchedSkills branch
  });

  it("shows a loading state while recommendations resolve", async () => {
    let resolve: (v: unknown) => void = () => {};
    recommendRoles.mockReturnValueOnce(new Promise((r) => { resolve = r; }));
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(screen.getByText(/Matching skills/)).toBeInTheDocument();
    resolve({ profileId: "user_2340", recommendations });
    expect(await screen.findByText("Matches Python")).toBeInTheDocument();
  });

  it("opens an explanation when a recommendation is selected", async () => {
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    await userEvent.click((await screen.findAllByRole("button", { name: /Explore this role/ }))[0]);
    await waitFor(() => expect(explainRole).toHaveBeenCalledWith({ roleId: "data_scientist", userId: "user_2340" }));
    expect(await screen.findByText("Turn data into decisions.")).toBeInTheDocument();
  });

  it("fills the prompt from a suggested chip", async () => {
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /I like AI but do not want to code/ }));
    expect((screen.getByLabelText("Career prompt") as HTMLTextAreaElement).value).toMatch(/I like AI/);
  });

  it("ignores an empty prompt submission", () => {
    const { container } = render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    fireEvent.submit(container.querySelector("form")!);
    expect(recommendRoles).not.toHaveBeenCalled();
  });

  it("renders the empty-recommendations state", async () => {
    recommendRoles.mockResolvedValue({ profileId: "user_2340", recommendations: [] });
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    await userEvent.type(screen.getByLabelText("Career prompt"), "zzz");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(await screen.findByText(/No roles matched/)).toBeInTheDocument();
  });

  it("renders a recommend error", async () => {
    recommendRoles.mockRejectedValueOnce(new Error("down"));
    render(<ExplainView userId="user_2340" roleId={null} onCompare={() => {}} />);
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(await screen.findByText(/Couldn’t fetch recommendations/)).toBeInTheDocument();
  });

  it("shows an explain error and retries", async () => {
    explainRole.mockRejectedValueOnce(new Error("boom")).mockResolvedValue(richExplanation);
    render(<ExplainView userId="user_2340" roleId="data_scientist" onCompare={() => {}} />);
    const retry = await screen.findByRole("button", { name: "Retry" });
    await userEvent.click(retry);
    expect(await screen.findByText("Turn data into decisions.")).toBeInTheDocument();
  });

  it("renders demo-guidance salary and omits related roles when absent", async () => {
    explainRole.mockResolvedValue(sparseExplanation);
    render(<ExplainView userId="user_2340" roleId="data_scientist" onCompare={() => {}} />);
    expect(await screen.findByText(/demo guidance only/)).toBeInTheDocument();
    expect(screen.queryByText(/Related:/)).not.toBeInTheDocument();
  });
});
