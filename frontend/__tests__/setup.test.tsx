import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("renders React with jest-dom matchers", () => {
    render(<button type="button">Lock In</button>);
    expect(screen.getByRole("button", { name: "Lock In" })).toBeInTheDocument();
  });
});
