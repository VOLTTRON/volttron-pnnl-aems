import * as fs from "node:fs";
import * as path from "node:path";

// @Cron, @Timeout and @Interval each set the one SCHEDULER_TYPE metadata key, so on a single method
// only the outermost takes effect: `@Timeout(5000) @Cron(EVERY_MINUTE)` runs once, five seconds
// after boot, and never again. A method gets one schedule; a second is a second method.
describe("scheduled methods", () => {
  const files = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return files(full);
      return e.name.endsWith(".ts") && !e.name.endsWith(".test.ts") ? [full] : [];
    });

  it("carry at most one of @Cron, @Timeout and @Interval", () => {
    const stacked: string[] = [];
    for (const file of files(path.join(__dirname, ".."))) {
      const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
      let run: number[] = [];
      lines.forEach((line, i) => {
        const trimmed = line.trim();
        if (/^@(Cron|Timeout|Interval)\(/.test(trimmed)) run.push(i + 1);
        else if (trimmed.startsWith("@") || trimmed.startsWith("//")) return;
        else {
          if (run.length > 1) stacked.push(`${path.relative(path.join(__dirname, ".."), file)}:${run[0]}`);
          run = [];
        }
      });
    }
    expect(stacked).toEqual([]);
  });
});
