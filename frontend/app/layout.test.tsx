import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "./layout";

describe("root layout", () => {
  it("renders its children", () => {
    // RootLayout returns <html><body>{children}</body></html>; jsdom renders it fine.
    render(<RootLayout>{<span>child-content</span>}</RootLayout>);
    expect(screen.getByText("child-content")).toBeInTheDocument();
  });

  it("exposes page metadata", () => {
    expect(metadata.title).toMatch(/Career Map/);
  });
});
