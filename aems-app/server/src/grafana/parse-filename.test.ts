import { parseDashboardFilename } from "./parse-filename";

// scenario: dashboard-filename-parsed-once
describe("parseDashboardFilename", () => {
  it("splits a double-dash filename at the first --, keeping underscores inside each name", () => {
    const parts = parseDashboardFilename("north_campus--main_building_dashboard_urls.json");
    expect(parts).toEqual({ campus: "north_campus", building: "main_building" });
  });

  it("splits a single-separator filename at the first underscore", () => {
    const parts = parseDashboardFilename("campus_building_dashboard_urls.json");
    expect(parts).toEqual({ campus: "campus", building: "building" });
  });

  it("prefers -- when both separators are present", () => {
    const parts = parseDashboardFilename("a_b--c_d_dashboard_urls.json");
    expect(parts).toEqual({ campus: "a_b", building: "c_d" });
  });

  it("keeps extra underscores to the right of the first in the building half", () => {
    const parts = parseDashboardFilename("campus_building_with_underscores_dashboard_urls.json");
    expect(parts).toEqual({ campus: "campus", building: "building_with_underscores" });
  });

  it("keeps a dash inside a campus or building name when the separator is --", () => {
    const parts = parseDashboardFilename("north-west--east-end_dashboard_urls.json");
    expect(parts).toEqual({ campus: "north-west", building: "east-end" });
  });

  it("lowercases what it returns, since Grafana roles are case-insensitive here", () => {
    const parts = parseDashboardFilename("CAMPUS--BUILDING_dashboard_urls.json");
    expect(parts).toEqual({ campus: "campus", building: "building" });
  });

  it("rejects a filename that lacks any separator in its stem", () => {
    expect(parseDashboardFilename("nosep_dashboard_urls.json")).toBeNull();
  });

  it("rejects a filename without the dashboard suffix", () => {
    expect(parseDashboardFilename("campus--building.json")).toBeNull();
    expect(parseDashboardFilename("something_else.json")).toBeNull();
  });

  it("rejects a filename whose campus or building half is empty", () => {
    expect(parseDashboardFilename("--building_dashboard_urls.json")).toBeNull();
    expect(parseDashboardFilename("campus--_dashboard_urls.json")).toBeNull();
    expect(parseDashboardFilename("_building_dashboard_urls.json")).toBeNull();
  });
});
