import { describe, expect, it } from "vitest";
import { getDashboardData } from "./data.js";

describe("dashboard data selectors", () => {
  it("filters projects, demand, workload, and risks by department", () => {
    const marketing = getDashboardData("营销中心", "2026-05");

    expect(marketing.projects.every((project) => project.department === "营销中心")).toBe(true);
    expect(marketing.demand.departments.every((row) => row.department === "营销中心")).toBe(true);
    expect(marketing.workload.every((row) => row.department === "营销中心")).toBe(true);
    expect(marketing.risks.length).toBeGreaterThan(0);
  });

  it("calculates top-level metrics from the selected dataset", () => {
    const all = getDashboardData("全部部门", "2026-05");

    expect(all.metrics.totalDemand).toBe(326);
    expect(all.metrics.acceptedDemand).toBe(248);
    expect(all.metrics.completedDemand).toBe(173);
    expect(all.metrics.highRiskProjects).toBe(9);
  });
});
