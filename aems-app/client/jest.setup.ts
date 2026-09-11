import "@testing-library/jest-dom";

// Strict console/rejection checking: any unasserted console.error, console.warn,
// or unhandled promise rejection during a test fails that test.
//
// Opt-out for a specific test: use `jest.spyOn(console, "error").mockImplementation(() => {})`
// (or the same for "warn") before triggering the log. The spy replaces the wrapper below,
// so nothing gets recorded and the strict check does not fire.
//
// Opt-out for a whole workspace: push a matcher onto `allowlist` below with a comment
// explaining *why* the message is exempt. Only add entries the caller genuinely cannot
// control (library-internal warnings, framework limitations).

const allowlist: Array<(args: unknown[]) => boolean> = [
  // Blueprint 5's Icon component loads SVG data via useEffect + Promise.then → setSvgData.
  // The Promise callback fires in the microtask queue after testing-library's synchronous
  // act() returns, so React issues an "not wrapped in act()" console.error for every
  // Blueprint component that renders an icon. This is a known Blueprint 5 limitation —
  // there is no way to make the lazy SVG load synchronous without patching Blueprint itself.
  (args) => args.some((a) => typeof a === "string" && a.includes("Blueprint5.Icon")),
  // Apollo Client 3.14 emits deprecation warnings (linked to https://go.apollo.dev/c/err)
  // from MockedProvider's internal use of `addTypename` and `canonizeResults`, even when
  // callers haven't opted in. Removing the props would change mock-matching semantics.
  (args) => args.some((a) => typeof a === "string" && a.includes("go.apollo.dev/c/err")),
];

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
      .map((c) => `[${c.level}] ${c.args.map((a) => (a instanceof Error ? (a.stack ?? a.message) : String(a))).join(" ")}`)
      .join("\n");
    throw new Error(`Test produced unexpected console output:\n${lines}`);
  }
});

// Blueprint.js uses ResizeObserver internally (Overlay2/Dialog portals)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
