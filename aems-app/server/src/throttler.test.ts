import * as fs from "node:fs";
import * as path from "node:path";

// jest runs from the server workspace.
const serverDir = process.cwd();

function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sources(full);
    return /\.ts$/.test(entry.name) && !/\.test\.ts$/.test(entry.name) ? [full] : [];
  });
}

// scenario: no-throttler
describe("request rate limiting", () => {
  it("is not a dependency of the server", () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(serverDir, "package.json"), "utf8"));
    const declared = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies });
    expect(declared.filter((name) => /throttl/i.test(name))).toEqual([]);
  });

  it("is imported by no server module", () => {
    const importing = sources(path.join(serverDir, "src")).filter((file) =>
      /from\s+["']@nestjs\/throttler["']|Throttler(Module|Guard)/.test(fs.readFileSync(file, "utf8")),
    );
    expect(importing.map((file) => path.relative(serverDir, file))).toEqual([]);
  });
});
