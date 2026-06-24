import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// Capture the props ExploreView is wired with.
let captured: { userId: string; onCompareRole: (id: string) => void; onOpenGuide: () => void } | null = null;
vi.mock("../../components/Explore/ExploreView", () => ({
  default: (props: any) => {
    captured = props;
    return (
      <div>
        <button onClick={() => props.onCompareRole("data_scientist")}>compare</button>
        <button onClick={() => props.onOpenGuide()}>guide</button>
      </div>
    );
  },
}));

import ExplorePage from "./page";

afterEach(() => { captured = null; });

describe("standalone /explore route", () => {
  it("mounts and wires ExploreView with the canonical user", () => {
    render(<ExplorePage />);
    expect(captured?.userId).toBe("user_2340");
  });

  it("navigates to the comparison demo when a role is compared", async () => {
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { href: "" } });
    render(<ExplorePage />);
    await userEvent.click(screen.getByText("compare"));
    expect(window.location.href).toContain("/comparison-demo?role=data_scientist");
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });

  it("routes to the integrated flow when the Career Guide is opened", async () => {
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { href: "x" } });
    render(<ExplorePage />);
    await userEvent.click(screen.getByText("guide"));
    expect(window.location.href).toBe("/");
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });
});
