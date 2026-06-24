import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import FitRing from "./FitRing";

afterEach(cleanup);

describe("FitRing", () => {
  it("renders the readinessScore value with a strong-match band at the top bound", () => {
    render(<FitRing percent={100} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/strong match/i)).toBeInTheDocument();
  });

  it("renders the just-getting-started band at the zero bound", () => {
    render(<FitRing percent={0} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(screen.getByText(/just getting started/i)).toBeInTheDocument();
  });

  it("renders the mid band for an in-between score", () => {
    render(<FitRing percent={50} />);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText(/on your way/i)).toBeInTheDocument();
  });
});
