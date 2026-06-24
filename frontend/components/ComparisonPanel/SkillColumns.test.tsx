import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import SkillColumns from "./SkillColumns";

afterEach(cleanup);

describe("SkillColumns", () => {
  it("renders strengths and missing gaps with counts", () => {
    render(<SkillColumns haveSkills={["Python", "SQL"]} missingSkills={["Machine Learning"]} />);
    expect(screen.getByText("Python")).toBeInTheDocument();
    expect(screen.getByText("SQL")).toBeInTheDocument();
    expect(screen.getByText("Machine Learning")).toBeInTheDocument();
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
  });

  it("shows the empty state for each column when its list is empty", () => {
    render(<SkillColumns haveSkills={[]} missingSkills={[]} />);
    expect(screen.getByText(/fresh start/i)).toBeInTheDocument();
    expect(screen.getByText(/everything this role needs/i)).toBeInTheDocument();
  });
});
