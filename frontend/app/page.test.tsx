import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../components/Flow/AppFlow", () => ({ default: () => <div>app-flow</div> }));

import Home from "./page";

describe("root route", () => {
  it("mounts and renders the integrated AppFlow", () => {
    render(<Home />);
    expect(screen.getByText("app-flow")).toBeInTheDocument();
  });
});
