// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import { configure } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import { get } from "lodash";
import { timestampGenerator } from "./controllers/util";

// set timestamps on busy and error types to a static time for testing
const date = new Date();
timestampGenerator(() => date);

// put timestamps on console statements
console.logCopy = console.log.bind(console);
console.log = function (message) {
  const header = `[${new Date().toUTCString()}]`;
  this.logCopy(header, message);
};

// throw an error when an error is printed to the console
let error = console.error;
console.error = function (message) {
  const text = get(message, "message", message);
  if (
    text.startsWith(
      "Error: Not implemented: HTMLCanvasElement.prototype.getContext (without installing the canvas npm package)"
    )
  ) {
    return;
  }
  error.apply(console, arguments); // keep default behaviour
  // throw message instanceof Error ? message : new Error(message);
  throw new Error("Warning message posted to console: " + text);
};

// throw an warn when a warning is printed to the console
let warn = console.warn;
console.warn = function (message) {
  const text = get(message, "message", message);
  warn.apply(console, arguments); // keep default behaviour
  // throw message instanceof Error ? message : new Error(message);
  throw new Error("Warning message posted to console: " + text);
};

// mock of matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// mock of scrollTo
Object.defineProperty(window, "scrollTo", {
  writable: false,
  value: jest.fn(),
});

// no op function necessary for plotly
function noOp() {}
if (typeof window.URL.createObjectURL === "undefined") {
  Object.defineProperty(window.URL, "createObjectURL", { value: noOp });
}

configure({ adapter: new Adapter() });
