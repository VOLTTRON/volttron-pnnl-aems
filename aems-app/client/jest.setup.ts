import "@testing-library/jest-dom";

// Blueprint 5's Icon component loads SVG data via useEffect + Promise.then → setSvgData.
// The Promise callback fires in the microtask queue after testing-library's synchronous
// act() returns, so React issues an "not wrapped in act()" console.error for every
// Blueprint component that renders an icon. This is a known Blueprint 5 limitation —
// there is no way to make the lazy SVG load synchronous without patching Blueprint itself.
// Filter it globally so it doesn't pollute test output.
const _consoleError = console.error.bind(console);
console.error = (...args: Parameters<typeof console.error>) => {
  // React passes the warning as a printf-style format string: args[0] is the template
  // ("Warning: An update to %s inside a test...") and args[1] is the component name.
  if (args.some((a) => typeof a === "string" && a.includes("Blueprint5.Icon"))) return;
  _consoleError(...args);
};

// Apollo Client 3.14 emits deprecation warnings (linked to https://go.apollo.dev/c/err)
// from MockedProvider's internal use of `addTypename` and `canonizeResults`, even when
// callers haven't opted in. Removing the props would change mock-matching semantics, so
// filter the warnings here to keep test output clean.
const _consoleWarn = console.warn.bind(console);
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (args.some((a) => typeof a === "string" && a.includes("go.apollo.dev/c/err"))) return;
  _consoleWarn(...args);
};

// Blueprint.js uses ResizeObserver internally (Overlay2/Dialog portals)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
