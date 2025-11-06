"use client";

import { createContext, useCallback, useEffect, useState } from "react";

// Breakpoint definitions following common responsive design patterns
const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
} as const;

export interface ScreenSizeContextType {
  // Device type detection
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Detailed screen info
  screenWidth: number;
  screenHeight: number;
  
  // Orientation
  isPortrait: boolean;
  isLandscape: boolean;
  
  // Touch capability
  isTouchDevice: boolean;
}

const defaultContextValue: ScreenSizeContextType = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenWidth: 1024,
  screenHeight: 768,
  isPortrait: false,
  isLandscape: true,
  isTouchDevice: false,
};

export const ScreenSizeContext = createContext<ScreenSizeContextType>(defaultContextValue);

/**
 * Detects if the device has touch capability
 */
const detectTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Gets the current screen dimensions
 */
const getScreenDimensions = () => {
  if (typeof window === "undefined") {
    return { width: 1024, height: 768 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Calculates device type based on screen width
 */
const calculateDeviceType = (width: number) => {
  const isMobile = width < BREAKPOINTS.mobile;
  const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  
  return { isMobile, isTablet, isDesktop };
};

/**
 * Calculates orientation based on screen dimensions
 */
const calculateOrientation = (width: number, height: number) => {
  const isPortrait = height > width;
  const isLandscape = width >= height;
  
  return { isPortrait, isLandscape };
};

/**
 * Provider for screen size and device detection.
 * Provides real-time updates on screen dimensions, device type, and orientation.
 */
export function ScreenSizeProvider({ children }: { children: React.ReactNode }) {
  const [screenState, setScreenState] = useState<ScreenSizeContextType>(() => {
    // Initialize with default values for SSR compatibility
    if (typeof window === "undefined") {
      return defaultContextValue;
    }
    
    const { width, height } = getScreenDimensions();
    const deviceType = calculateDeviceType(width);
    const orientation = calculateOrientation(width, height);
    const isTouchDevice = detectTouchDevice();
    
    return {
      ...deviceType,
      screenWidth: width,
      screenHeight: height,
      ...orientation,
      isTouchDevice,
    };
  });

  const updateScreenState = useCallback(() => {
    const { width, height } = getScreenDimensions();
    const deviceType = calculateDeviceType(width);
    const orientation = calculateOrientation(width, height);
    const isTouchDevice = detectTouchDevice();
    
    setScreenState({
      ...deviceType,
      screenWidth: width,
      screenHeight: height,
      ...orientation,
      isTouchDevice,
    });
  }, []);

  useEffect(() => {
    // Update state on mount to get actual client-side values
    updateScreenState();
    
    // Debounced resize handler to prevent excessive re-renders
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScreenState, 150);
    };
    
    // Event listeners for screen changes
    window.addEventListener("resize", debouncedResize);
    window.addEventListener("orientationchange", debouncedResize);
    
    // Cleanup event listeners
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedResize);
      window.removeEventListener("orientationchange", debouncedResize);
    };
  }, [updateScreenState]);

  return (
    <ScreenSizeContext.Provider value={screenState}>
      {children}
    </ScreenSizeContext.Provider>
  );
}
