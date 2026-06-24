import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import LinkedInNav from "./LinkedInNav";

describe("LinkedInNav", () => {
  it("renders and wires the functional nav controls", async () => {
    const onHome = vi.fn(); const onJobs = vi.fn(); const onProfile = vi.fn(); const onRestart = vi.fn();
    render(<LinkedInNav userName="Bob Smith" onHome={onHome} onJobs={onJobs} onProfile={onProfile} onRestart={onRestart} />);
    for (const label of ["Home", "Jobs", "Me"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("B")).toBeInTheDocument(); // avatar initial
    await userEvent.click(screen.getByText("Jobs")); expect(onJobs).toHaveBeenCalled();
    await userEvent.click(screen.getByText("Me")); await userEvent.click(screen.getByRole("menuitem", { name: "Restart" })); expect(onRestart).toHaveBeenCalled();
  });

  it("falls back to a default initial when no userName is given", () => {
    render(<LinkedInNav />);
    expect(screen.getByText("Y")).toBeInTheDocument();
  });
});
