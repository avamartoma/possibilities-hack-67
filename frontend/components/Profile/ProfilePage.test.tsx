import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ProfilePage from "./ProfilePage";
import type { UserProfile } from "../../lib/types";

const richProfile: UserProfile = {
  id: "user_2340",
  name: "Bob Smith",
  headline: "Senior Software Engineer",
  currentStatus: "Open to work",
  skills: ["AWS", "DevOps"],
  experience: [
    { title: "Senior SWE", company: "Innovatech", employmentType: "Full-time", start: "2022", end: "Present", location: "Austin, TX", description: "Lead cloud platform.", skills: ["AWS"] },
    { title: "SWE", company: "Cobalt" },
    {}, // no title/company/etc. — exercises Initial + optional-field fallbacks
  ] as unknown as Record<string, unknown>[],
  education: [
    { school: "Stanford", degree: "CS", field: "CS", graduationYear: 2022 },
    { field: "Education" }, // no school/degree/graduationYear
    {}, // no school/field — exercises Initial fallback
  ] as unknown as Record<string, unknown>[],
  interests: ["Software Engineer"],
  savedGoals: ["Grow toward DevOps Engineer"],
  location: "Austin, TX",
};

const minimalProfile: UserProfile = {
  id: "user_x",
  name: "ada lovelace",
  headline: "Exploring career options",
  currentStatus: "Exploring next career steps",
  skills: [],
  experience: [],
  education: [],
  interests: [],
  savedGoals: [],
  location: null,
};

describe("ProfilePage", () => {
  it("renders the normalized identity and all populated sections", () => {
    render(<ProfilePage profile={richProfile} onLockIn={() => {}} />);
    expect(screen.getByRole("heading", { name: "Bob Smith", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("Senior Software Engineer")).toBeInTheDocument();
    expect(screen.getAllByText("Austin, TX").length).toBeGreaterThan(0);
    expect(screen.getByText("Open to work")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Experience" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Education" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Skills" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Interests" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved goals" })).toBeInTheDocument();
    expect(screen.getByText("Graduated 2022")).toBeInTheDocument();
    expect(screen.getByText("Grow toward DevOps Engineer")).toBeInTheDocument();
  });

  it("omits sections that have no data", () => {
    render(<ProfilePage profile={minimalProfile} onLockIn={() => {}} />);
    expect(screen.queryByRole("heading", { name: "Experience" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Education" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Skills" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Interests" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Saved goals" })).not.toBeInTheDocument();
  });

  it("fires onLockIn when the entry CTA is clicked", async () => {
    const onLockIn = vi.fn();
    render(<ProfilePage profile={richProfile} onLockIn={onLockIn} />);
    await userEvent.click(screen.getByRole("button", { name: /Lock In/ }));
    expect(onLockIn).toHaveBeenCalledOnce();
  });
});
