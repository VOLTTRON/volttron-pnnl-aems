// A dashboard config's filename names its campus and building. Two forms:
//   campus--building_dashboard_urls.json   split at the first "--"
//   campus_building_dashboard_urls.json    split at the first "_"
// A campus or building name may contain "_" or "-", so the split is on the
// first separator rather than any later one.

const DashboardUrlsSuffix = "_dashboard_urls.json";

export type DashboardFilenameParts = {
  campus: string;
  building: string;
};

export function parseDashboardFilename(filename: string): DashboardFilenameParts | null {
  const lower = filename.toLowerCase();
  if (!lower.endsWith(DashboardUrlsSuffix)) {
    return null;
  }
  const stem = lower.slice(0, -DashboardUrlsSuffix.length);
  const doubleDash = stem.indexOf("--");
  if (doubleDash >= 0) {
    const campus = stem.slice(0, doubleDash);
    const building = stem.slice(doubleDash + 2);
    if (!campus || !building) return null;
    return { campus, building };
  }
  const underscore = stem.indexOf("_");
  if (underscore < 0) return null;
  const campus = stem.slice(0, underscore);
  const building = stem.slice(underscore + 1);
  if (!campus || !building) return null;
  return { campus, building };
}
