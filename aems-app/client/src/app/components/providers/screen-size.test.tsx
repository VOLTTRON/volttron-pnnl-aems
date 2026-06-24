import { renderHook, act } from "@testing-library/react";
import { useContext } from "react";
import { ScreenSizeContext, ScreenSizeProvider } from "./screen-size";

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
}

function wrapper({ children }: { children: React.ReactNode }) {
  return <ScreenSizeProvider>{children}</ScreenSizeProvider>;
}

describe("ScreenSizeProvider", () => {
  afterEach(() => {
    // Reset to desktop defaults
    setWindowSize(1024, 768);
  });

  it("detects desktop when width >= 1024", async () => {
    setWindowSize(1280, 800);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });
    await act(async () => {});
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isMobile).toBe(false);
  });

  it("detects tablet when width is 768–1023", async () => {
    setWindowSize(900, 600);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });
    await act(async () => {});
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("detects mobile when width < 768", async () => {
    setWindowSize(375, 667);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });
    await act(async () => {});
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("reports portrait when height > width", async () => {
    setWindowSize(375, 812);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });
    await act(async () => {});
    expect(result.current.isPortrait).toBe(true);
    expect(result.current.isLandscape).toBe(false);
  });

  it("reports landscape when width >= height", async () => {
    setWindowSize(1280, 800);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });
    await act(async () => {});
    expect(result.current.isLandscape).toBe(true);
    expect(result.current.isPortrait).toBe(false);
  });

  it("exposes correct screenWidth and screenHeight", async () => {
    setWindowSize(1440, 900);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });
    await act(async () => {});
    expect(result.current.screenWidth).toBe(1440);
    expect(result.current.screenHeight).toBe(900);
  });

  it("updates on resize event", async () => {
    jest.useFakeTimers();
    setWindowSize(1280, 800);
    const { result } = renderHook(() => useContext(ScreenSizeContext), { wrapper });

    // Flush initial useEffect update
    act(() => {
      jest.runAllTimers();
    });
    expect(result.current.isMobile).toBe(false);

    // Simulate a resize to mobile dimensions
    act(() => {
      setWindowSize(375, 667);
      window.dispatchEvent(new Event("resize"));
      jest.advanceTimersByTime(200); // advance past debounce
    });

    jest.useRealTimers();

    expect(result.current.isMobile).toBe(true);
  });
});
