import { parseDashboardFilename } from "./filename";

// scenario: dashboard-filename-parsed-once
describe("parseDashboardFilename", () => {
  it("splits a `campus--building` name at the first `--`", () => {
    expect(parseDashboardFilename("pnnl--sef_dashboard_urls.json")).toEqual({ campus: "pnnl", building: "sef" });
  });

  it("splits a `campus_building` name at the first `_`", () => {
    expect(parseDashboardFilename("pnnl_sef_dashboard_urls.json")).toEqual({ campus: "pnnl", building: "sef" });
  });

  it("keeps `_` inside the building half of a `--`-split name", () => {
    expect(parseDashboardFilename("pnnl--sef_b_1_dashboard_urls.json")).toEqual({ campus: "pnnl", building: "sef_b_1" });
  });

  it("keeps `-` inside either half of a `--`-split name", () => {
    expect(parseDashboardFilename("pn-nl--se-f_dashboard_urls.json")).toEqual({ campus: "pn-nl", building: "se-f" });
  });

  it("returns undefined when the suffix is missing", () => {
    expect(parseDashboardFilename("pnnl_sef.json")).toBeUndefined();
    expect(parseDashboardFilename("pnnl--sef.json")).toBeUndefined();
  });

  it("returns undefined when the stem has no separator at all", () => {
    expect(parseDashboardFilename("pnnl_dashboard_urls.json")).toBeUndefined();
  });

  it("returns undefined when either half is empty", () => {
    expect(parseDashboardFilename("--sef_dashboard_urls.json")).toBeUndefined();
    expect(parseDashboardFilename("pnnl--_dashboard_urls.json")).toBeUndefined();
    expect(parseDashboardFilename("_sef_dashboard_urls.json")).toBeUndefined();
  });

  it("is case-insensitive on the suffix", () => {
    expect(parseDashboardFilename("pnnl_sef_DASHBOARD_URLS.JSON")).toEqual({ campus: "pnnl", building: "sef" });
  });
});
