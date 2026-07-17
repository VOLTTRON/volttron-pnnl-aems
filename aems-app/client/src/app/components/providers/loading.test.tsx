import { renderHook, act } from "@testing-library/react";
import { useContext } from "react";
import { LoadingContext, LoadingProvider, LoadingType, LoadingModel } from "./loading";

describe("LoadingModel", () => {
  it("defaults to LOCAL type", () => {
    const l = new LoadingModel();
    expect(l.type).toBe(LoadingType.LOCAL);
    expect(l.id).toMatch(/^Loading-\d+$/);
    expect(l.timestamp).toBeGreaterThan(0);
  });

  it("accepts GLOBAL type", () => {
    const l = new LoadingModel(LoadingType.GLOBAL);
    expect(l.type).toBe(LoadingType.GLOBAL);
  });
});

function wrapper({ children }: { children: React.ReactNode }) {
  return <LoadingProvider>{children}</LoadingProvider>;
}

describe("LoadingProvider", () => {
  it("exposes empty loadings initially", () => {
    const { result } = renderHook(() => useContext(LoadingContext), { wrapper });
    expect(result.current.loadings).toEqual([]);
  });

  it("createLoading adds a LOCAL loading by default", () => {
    const { result } = renderHook(() => useContext(LoadingContext), { wrapper });
    act(() => {
      result.current.createLoading!();
    });
    expect(result.current.loadings).toHaveLength(1);
    expect(result.current.loadings![0].type).toBe(LoadingType.LOCAL);
  });

  it("createLoading adds a GLOBAL loading", () => {
    const { result } = renderHook(() => useContext(LoadingContext), { wrapper });
    act(() => {
      result.current.createLoading!(LoadingType.GLOBAL);
    });
    expect(result.current.loadings![0].type).toBe(LoadingType.GLOBAL);
  });

  it("clearLoading removes the loading", () => {
    const { result } = renderHook(() => useContext(LoadingContext), { wrapper });
    let loading: ReturnType<NonNullable<typeof result.current.createLoading>>;
    act(() => {
      loading = result.current.createLoading!();
    });
    expect(result.current.loadings).toHaveLength(1);
    act(() => {
      result.current.clearLoading!(loading!);
    });
    expect(result.current.loadings).toHaveLength(0);
  });

  it("two loadings can coexist", () => {
    const { result } = renderHook(() => useContext(LoadingContext), { wrapper });
    act(() => {
      result.current.createLoading!(LoadingType.LOCAL);
    });
    act(() => {
      result.current.createLoading!(LoadingType.GLOBAL);
    });
    expect(result.current.loadings).toHaveLength(2);
  });
});
