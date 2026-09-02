// Strict console/rejection checking: any unasserted console.error, console.warn,
// or unhandled promise rejection during a test fails that test.
//
// Opt-out for a specific test: use `jest.spyOn(console, "error").mockImplementation(() => {})`
// (or the same for "warn") before triggering the log. The spy replaces the wrapper below,
// so nothing gets recorded and the strict check does not fire.
//
// Opt-out for a whole workspace (rare): push a matcher onto `allowlist` below with a
// comment explaining *why* the message is exempt.

const allowlist: Array<(args: unknown[]) => boolean> = [];

type Captured = { level: "error" | "warn"; args: unknown[] };
const captured: Captured[] = [];
let unhandled: unknown = null;
let sawUnhandled = false;

const onUnhandled = (reason: unknown) => {
  sawUnhandled = true;
  unhandled = reason;
};

let originalError: typeof console.error;
let originalWarn: typeof console.warn;

beforeEach(() => {
  captured.length = 0;
  unhandled = null;
  sawUnhandled = false;
  originalError = console.error;
  originalWarn = console.warn;
  console.error = (...args: unknown[]) => {
    if (allowlist.some((f) => f(args))) return;
    captured.push({ level: "error", args });
    (originalError as (...a: unknown[]) => void)(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (allowlist.some((f) => f(args))) return;
    captured.push({ level: "warn", args });
    (originalWarn as (...a: unknown[]) => void)(...args);
  };
  process.on("unhandledRejection", onUnhandled);
});

afterEach(() => {
  process.off("unhandledRejection", onUnhandled);
  console.error = originalError;
  console.warn = originalWarn;
  if (sawUnhandled) {
    throw unhandled instanceof Error ? unhandled : new Error(`Unhandled rejection: ${String(unhandled)}`);
  }
  if (captured.length > 0) {
    const lines = captured
      .map((c) => `[${c.level}] ${c.args.map((a) => (a instanceof Error ? a.stack ?? a.message : String(a))).join(" ")}`)
      .join("\n");
    throw new Error(`Test produced unexpected console output:\n${lines}`);
  }
});
