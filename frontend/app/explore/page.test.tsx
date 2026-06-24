import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

// Capture the props ExploreView is wired with.
let captured: { userId: string; onSelectRole: (id: string) => void } | null = null;
vi.mock("../../components/Explore/ExploreView", () => ({
  default: (props: any) => {
    captured = props;
    return <button onClick={() => props.onSelectRole("data_scientist")}>pick</button>;
  },
}));

import ExplorePage from "./page";

afterEach(() => { captured = null; });

describe("standalone /explore route", () => {
  it("mounts and wires ExploreView with the canonical user", () => {
    render(<ExplorePage />);
    expect(captured?.userId).toBe("user_2340");
  });

  it("navigates to the comparison demo when a role is selected", async () => {
    const original = window.location;
    // jsdom location is non-writable; replace with a stub for the assertion.
    Object.defineProperty(window, "location", { configurable: true, value: { href: "" } });
    render(<ExplorePage />);
    await userEvent.click(screen.getByText("pick"));
    expect(window.location.href).toContain("/comparison-demo?role=data_scientist");
    Object.defineProperty(window, "location", { configurable: true, value: original });
  });
});
