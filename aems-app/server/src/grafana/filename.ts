/**
 * The one parser for a Grafana dashboard config filename. Returns campus and building, or
 * undefined. The filename stem (what sits before `_dashboard_urls.json`) is split at the first
 * `--` when the stem contains one, else at the first `_`; both halves must be non-empty.
 */
export function parseDashboardFilename(filename: string): { campus: string; building: string } | undefined {
  const match = /^(.+)_dashboard_urls\.json$/i.exec(filename);
  if (!match) return undefined;
  const stem = match[1];
  const dash = stem.indexOf("--");
  const [campus, building] =
    dash !== -1
      ? [stem.slice(0, dash), stem.slice(dash + 2)]
      : (() => {
          const under = stem.indexOf("_");
          return under === -1 ? ["", ""] : [stem.slice(0, under), stem.slice(under + 1)];
        })();
  if (!campus || !building) return undefined;
  return { campus, building };
}
