import { describe, expect, it } from "vitest";
import { li } from "./theme";

describe("LinkedIn design tokens", () => {
  it("exposes the brand blue and core surfaces", () => {
    expect(li.blue).toBe("#0a66c2");
    expect(li.cardBg).toBe("#ffffff");
    expect(li.cardRadius).toBe(8);
  });

  it("exposes semantic accent colors and a font stack", () => {
    expect(li.green).toMatch(/^#/);
    expect(li.amber).toMatch(/^#/);
    expect(li.font).toContain("system-ui");
  });
});
