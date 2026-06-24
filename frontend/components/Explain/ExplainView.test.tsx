import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RoleRecommendation, TopApplicantJob } from "../../lib/types";

const recommendRoles = vi.fn();
const getTopApplicantJobs = vi.fn();
vi.mock("../../lib/api", () => ({
  recommendRoles: (...a: unknown[]) => recommendRoles(...a),
  getTopApplicantJobs: (...a: unknown[]) => getTopApplicantJobs(...a),
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
function job(id: string, company: string, roleId: string, topApplicant: boolean): TopApplicantJob {
  return { id, company, location: "Austin, TX", level: "Senior", salaryFrom: 100000, salaryTo: 150000, easyApply: true, roleId, score: topApplicant ? 90 : 30, topApplicant };
}

const TOP_JOBS = [job("job_1", "Acme", "data_scientist", true), job("job_2", "Globex", "ux_designer", false)];
const RECS: RoleRecommendation[] = [
  { role: careerRole("data_scientist", "Data Scientist"), score: 9, readinessScore: 60, scoreReasons: ["Matches Python"], matchedSkills: ["Python"] },
  { role: careerRole("ux_designer", "UX Designer"), score: 3, readinessScore: 0, scoreReasons: ["Adjacent role to explore"], matchedSkills: [] },
];

beforeEach(() => {
  recommendRoles.mockReset();
  getTopApplicantJobs.mockReset();
  recommendRoles.mockResolvedValue({ profileId: "user_2340", recommendations: RECS });
  getTopApplicantJobs.mockResolvedValue({ jobs: TOP_JOBS, total: TOP_JOBS.length });
});
afterEach(() => vi.clearAllMocks());

const noop = () => {};

describe("ExplainView (Career Guide)", () => {
  it("loads the top-applicant jobs scroller on entry", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    expect(screen.getByText(/Finding your best-fit jobs/)).toBeInTheDocument();
    expect(await screen.findByText("Acme")).toBeInTheDocument();
    expect(getTopApplicantJobs).toHaveBeenCalledWith({ userId: "user_2340", limit: 25 });
    expect(screen.getByText("Top applicant")).toBeInTheDocument(); // topApplicant=true badge
    expect(screen.getByTestId("top-jobs-scroll")).toBeInTheDocument();
  });

  it("opens the modal from a top-applicant job and compares from it", async () => {
    const onCompare = vi.fn();
    render(<ExplainView userId="user_2340" onCompare={onCompare} />);
    const acme = (await screen.findByText("Acme")).closest("article")!;
    await userEvent.click(within(acme).getByRole("button", { name: /Explore this role/ }));
    expect(screen.getByText("modal:data_scientist")).toBeInTheDocument();
    await userEvent.click(screen.getByText("modal-compare"));
    expect(onCompare).toHaveBeenCalledWith("data_scientist");
    expect(screen.queryByText("modal:data_scientist")).not.toBeInTheDocument();
  });

  it("shows empty and error+retry states for the scroller", async () => {
    getTopApplicantJobs.mockResolvedValueOnce({ jobs: [], total: 0 });
    const { unmount } = render(<ExplainView userId="user_2340" onCompare={noop} />);
    expect(await screen.findByText(/No strong matches yet/)).toBeInTheDocument();
    unmount();

    getTopApplicantJobs.mockRejectedValueOnce(new Error("down")).mockResolvedValue({ jobs: TOP_JOBS, total: 2 });
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await userEvent.click(await screen.findByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Acme")).toBeInTheDocument();
  });

  it("submits the prompt and renders score reasons + matched skills", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("Acme");
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
    await screen.findByText("Acme");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(screen.getByText(/Matching skills/)).toBeInTheDocument();
    resolve({ profileId: "user_2340", recommendations: RECS });
    expect(await screen.findByText("Matches Python")).toBeInTheDocument();
  });

  it("opens the modal from a recommendation", async () => {
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("Acme");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    const recCard = (await screen.findByText("Data Scientist")).closest("article")!;
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
    await screen.findByText("Acme");
    fireEvent.submit(container.querySelector('form[aria-label="career prompt"]')!);
    expect(recommendRoles).not.toHaveBeenCalled();
  });

  it("renders empty and error recommendation states", async () => {
    recommendRoles.mockResolvedValueOnce({ profileId: "user_2340", recommendations: [] });
    const { unmount } = render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("Acme");
    await userEvent.type(screen.getByLabelText("Career prompt"), "zzz");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(await screen.findByText(/No roles matched/)).toBeInTheDocument();
    unmount();

    recommendRoles.mockRejectedValueOnce(new Error("down"));
    render(<ExplainView userId="user_2340" onCompare={noop} />);
    await screen.findByText("Acme");
    await userEvent.type(screen.getByLabelText("Career prompt"), "data");
    await userEvent.click(screen.getByRole("button", { name: "Find my fit" }));
    expect(await screen.findByText(/Couldn’t fetch recommendations/)).toBeInTheDocument();
  });
});
