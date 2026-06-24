import { renderHook, act } from "@testing-library/react";
import { useContext } from "react";
import {
  isPreferences,
  compilePreferences,
  DefaultPreferences,
  PreferencesContext,
  PreferencesProvider,
} from "./preferences";
import { Mode } from "@local/prisma";

// Minimal localStorage mock
let store: Record<string, string> = {};
beforeEach(() => {
  store = {};
  jest.spyOn(window.localStorage.__proto__, "getItem").mockImplementation((...args: unknown[]) => store[args[0] as string] ?? null);
  jest.spyOn(window.localStorage.__proto__, "setItem").mockImplementation((...args: unknown[]) => {
    store[args[0] as string] = args[1] as string;
  });
});
afterEach(() => jest.restoreAllMocks());

describe("isPreferences", () => {
  it("returns true for a valid preferences object", () => {
    expect(isPreferences({ theme: "default", mode: Mode.Light })).toBe(true);
  });

  it("returns true for dark mode", () => {
    expect(isPreferences({ theme: "custom", mode: Mode.Dark })).toBe(true);
  });

  it("returns false when mode is invalid", () => {
    expect(isPreferences({ theme: "default", mode: "banana" })).toBe(false);
  });

  it("returns false when missing mode", () => {
    expect(isPreferences({ theme: "default" })).toBe(false);
  });

  it("returns false when missing theme", () => {
    expect(isPreferences({ mode: Mode.Light })).toBe(false);
  });

  it("returns false for undefined", () => {
    expect(isPreferences(undefined)).toBe(false);
  });

  it("returns false for a plain string", () => {
    // typeof "string" === "string", so falls out of the object check
    expect(isPreferences("string")).toBe(false);
  });
});

describe("compilePreferences", () => {
  it("returns DefaultPreferences when called with no args", () => {
    expect(compilePreferences()).toEqual(DefaultPreferences);
  });

  it("merges later values over defaults", () => {
    const result = compilePreferences({ mode: Mode.Dark });
    expect(result.mode).toBe(Mode.Dark);
    expect(result.theme).toBe(DefaultPreferences.theme);
  });

  it("later args override earlier args", () => {
    const result = compilePreferences({ mode: Mode.Dark }, { mode: Mode.Light });
    expect(result.mode).toBe(Mode.Light);
  });

  it("ignores null and undefined entries", () => {
    const result = compilePreferences(null, undefined, { mode: Mode.Dark });
    expect(result.mode).toBe(Mode.Dark);
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <PreferencesProvider>{children}</PreferencesProvider>;
}

describe("PreferencesProvider", () => {
  it("starts with DefaultPreferences", () => {
    const { result } = renderHook(() => useContext(PreferencesContext), { wrapper });
    expect(result.current.preferences).toEqual(DefaultPreferences);
  });

  it("updates preferences when setPreferences is called", () => {
    const { result } = renderHook(() => useContext(PreferencesContext), { wrapper });
    act(() => {
      result.current.setPreferences!({ ...DefaultPreferences, mode: Mode.Dark });
    });
    expect(result.current.preferences?.mode).toBe(Mode.Dark);
  });

  it("persists preferences to localStorage", () => {
    const { result } = renderHook(() => useContext(PreferencesContext), { wrapper });
    act(() => {
      result.current.setPreferences!({ ...DefaultPreferences, mode: Mode.Dark });
    });
    const stored = JSON.parse(store["preferences"] ?? "{}");
    expect(stored.mode).toBe(Mode.Dark);
  });

  it("strips sensitive keys (name) from localStorage write", () => {
    const { result } = renderHook(() => useContext(PreferencesContext), { wrapper });
    act(() => {
      result.current.setPreferences!({ ...DefaultPreferences, name: "secret" } as any);
    });
    const stored = JSON.parse(store["preferences"] ?? "{}");
    expect(stored.name).toBeUndefined();
  });

  it("reads preferences from localStorage on mount", async () => {
    store["preferences"] = JSON.stringify({ theme: "ocean", mode: Mode.Dark });
    const { result } = renderHook(() => useContext(PreferencesContext), { wrapper });
    // useEffect fires asynchronously; wait for re-render
    await act(async () => {});
    expect(result.current.preferences?.theme).toBe("ocean");
    expect(result.current.preferences?.mode).toBe(Mode.Dark);
  });

  it("ignores missing localStorage data (no key set)", async () => {
    // store is empty — nothing persisted
    const { result } = renderHook(() => useContext(PreferencesContext), { wrapper });
    await act(async () => {});
    expect(result.current.preferences).toEqual(DefaultPreferences);
  });
});
