import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LinkedInNav from "./LinkedInNav";

describe("LinkedInNav", () => {
  it("renders the LinkedIn-style nav items", () => {
    render(<LinkedInNav userName="Bob Smith" />);
    for (const label of ["Home", "My Network", "Jobs", "Messaging", "Notifications"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("B")).toBeInTheDocument(); // avatar initial
  });

  it("falls back to a default initial when no userName is given", () => {
    render(<LinkedInNav />);
    expect(screen.getByText("Y")).toBeInTheDocument();
  });
});
