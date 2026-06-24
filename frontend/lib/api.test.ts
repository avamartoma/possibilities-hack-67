import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  compareRole,
  explainRole,
  generatePath,
  getCourses,
  getFit,
  getMilestonePlan,
  getProfile,
  getRole,
  getRoles,
  getUsers,
  recommendRoles,
  searchRoles,
} from "./api";

function ok(data: unknown) {
  return { ok: true, status: 200, json: async () => data } as Response;
}
function notOk(status = 500) {
  return { ok: false, status, json: async () => ({}) } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("v2 POST helpers", () => {
  it("searchRoles posts the expected JSON body", async () => {
    fetchMock.mockResolvedValueOnce(ok({ roles: [] }));
    await searchRoles({ query: "data", categories: [], skills: [], limit: 20 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/roles/search");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ query: "data", categories: [], skills: [], limit: 20 });
  });

  it("searchRoles defaults to an empty body", async () => {
    fetchMock.mockResolvedValueOnce(ok({ roles: [] }));
    await searchRoles();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({});
  });

  it("recommendRoles sends userId, query, interests and override", async () => {
    fetchMock.mockResolvedValueOnce(ok({ profileId: "user_2340", recommendations: [] }));
    await recommendRoles({ userId: "user_2340", query: "data", interests: ["AI"], profileOverride: { skills: ["Python"] } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/roles/recommend");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ userId: "user_2340", query: "data", interests: ["AI"], profileOverride: { skills: ["Python"] } });
  });

  it("explainRole posts roleId and userId", async () => {
    fetchMock.mockResolvedValueOnce(ok({ role: {}, dayToDay: [] }));
    await explainRole({ roleId: "data_scientist", userId: "user_2340" });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/roles/explain");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ roleId: "data_scientist", userId: "user_2340" });
  });

  it("compareRole uses POST and rejects on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(notOk(502));
    await expect(compareRole({ userId: "user_2340", roleId: "data_scientist" })).rejects.toThrow(/502/);
  });

  it("generatePath uses POST and rejects on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(notOk(500));
    await expect(generatePath({ userId: "user_2340", roleId: "data_scientist" })).rejects.toThrow(/500/);
  });

  it("compareRole resolves the parsed body on success", async () => {
    fetchMock.mockResolvedValueOnce(ok({ readinessScore: 42 }));
    await expect(compareRole({ userId: "user_2340", roleId: "data_scientist" })).resolves.toEqual({ readinessScore: 42 });
  });

  it("generatePath posts maxMilestones when provided", async () => {
    fetchMock.mockResolvedValueOnce(ok({ milestones: [] }));
    await generatePath({ userId: "user_2340", roleId: "data_scientist", maxMilestones: 3 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ userId: "user_2340", roleId: "data_scientist", maxMilestones: 3 });
  });
});

describe("GET helpers encode identifiers and handle errors", () => {
  it("getProfile encodes the userId and returns JSON", async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: "a/b" }));
    await getProfile("a/b");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/profile/a%2Fb");
  });

  it("getProfile throws on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(notOk(404));
    await expect(getProfile("nope")).rejects.toThrow(/404/);
  });

  it("getRole encodes the roleId and returns JSON", async () => {
    fetchMock.mockResolvedValueOnce(ok({ id: "x y" }));
    await getRole("x y");
    expect(fetchMock.mock.calls[0][0]).toBe("/api/roles/x%20y");
  });

  it("getRole throws on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(notOk(404));
    await expect(getRole("nope")).rejects.toThrow(/404/);
  });
});

describe("legacy helpers prefer the backend and fall back to bundled data", () => {
  it("getRoles returns the live payload when the backend responds", async () => {
    fetchMock.mockResolvedValueOnce(ok([{ id: "live_role" }]));
    await expect(getRoles()).resolves.toEqual([{ id: "live_role" }]);
  });

  it("getRoles falls back to bundled roles on a non-OK response", async () => {
    fetchMock.mockResolvedValueOnce(notOk());
    const roles = await getRoles();
    expect(roles.length).toBeGreaterThan(0);
  });

  it("getUsers falls back to bundled users when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"));
    const users = await getUsers();
    expect(users.some((u) => u.id === "user_2340")).toBe(true);
  });

  it("getCourses falls back to bundled courses", async () => {
    fetchMock.mockResolvedValueOnce(notOk());
    const courses = await getCourses();
    expect(Object.keys(courses).length).toBeGreaterThan(0);
  });

  it("getFit returns the live fit when available", async () => {
    fetchMock.mockResolvedValueOnce(ok({ percent: 88, role: {}, haveSkills: [], missingSkills: [] }));
    await expect(getFit("user_2340", "marketing_specialist")).resolves.toMatchObject({ percent: 88 });
  });

  it("getFit computes locally when the backend is down", async () => {
    fetchMock.mockResolvedValueOnce(notOk());
    const fit = await getFit("user_2340", "marketing_specialist");
    expect(fit.percent).toBeGreaterThanOrEqual(0);
    expect(fit.percent).toBeLessThanOrEqual(100);
  });

  it("getFit throws when the user or role is unknown and backend is down", async () => {
    fetchMock.mockResolvedValueOnce(notOk());
    await expect(getFit("ghost", "ghost_role")).rejects.toThrow(/Unknown/);
  });

  it("getMilestonePlan returns the live plan when available", async () => {
    fetchMock.mockResolvedValueOnce(ok({ milestones: [{ step: 1 }] }));
    await expect(getMilestonePlan("user_2340", "marketing_specialist")).resolves.toMatchObject({ milestones: [{ step: 1 }] });
  });

  it("getMilestonePlan builds course-backed steps from the local fallback", async () => {
    fetchMock.mockResolvedValue(notOk()); // both milestone + fit calls fall back
    const plan = await getMilestonePlan("user_2340", "marketing_specialist");
    expect(plan.milestones.length).toBeGreaterThan(0);
    expect(plan.milestones[0].actions.length).toBe(3);
  });

  it("getMilestonePlan yields a portfolio milestone when nothing is missing", async () => {
    // A backend-down milestone call, then a live fit with no missing skills.
    fetchMock
      .mockResolvedValueOnce(notOk())
      .mockResolvedValueOnce(ok({ percent: 100, role: { name: "Role" }, haveSkills: ["X"], missingSkills: [] }));
    const plan = await getMilestonePlan("user_2340", "marketing_specialist");
    expect(plan.milestones).toHaveLength(1);
    expect(plan.milestones[0].skill).toBe("Portfolio evidence");
    expect(plan.milestones[0].course).toBeNull();
  });
});
