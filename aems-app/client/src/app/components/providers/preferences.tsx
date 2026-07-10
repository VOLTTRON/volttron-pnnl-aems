"use client";

import { createContext, useCallback, useEffect } from "react";
import { deepMerge, omit } from "@local/common";
import { useState } from "react";
import { SensitivePreferences } from "./current";
import { Mode, Preferences as PrismaPreferences } from "@local/prisma";

export interface ClientPreferences {
  palette1?: string; // Primary palette (temperatures, main metrics)
  palette2?: string; // Secondary palette (setpoints, demands)
  palette3?: string; // Tertiary palette (status, states)
  paletteWarm?: string; // Warm palette (heating, warm colors)
  paletteCool?: string; // Cool palette (cooling, cool colors)
  paletteGradient?: string; // Gradient palette (humidity, gradients)
  // Last predefined dashboard time range preset chosen in this browser.
  // Stored in localStorage only; the server has no column for it.
  dashboardTimeRangePreset?: string;
}

export type ServerPreferences = Omit<PrismaPreferences, (typeof SensitivePreferences)[number]>;

export type Preferences = ServerPreferences & ClientPreferences & Partial<PrismaPreferences>;

export type setPreferences = (preferences: Preferences) => void;

export const PreferencesContext = createContext<{
  preferences?: Preferences;
  setPreferences?: setPreferences;
}>({});

export const DefaultPreferences: Preferences = {
  theme: "default",
  mode: Mode.Light,
  palette1: "AEMS Cool Tones", // Primary: blues and purples for cooling/temperature
  palette2: "AEMS Warm Tones", // Secondary: reds, oranges, yellows for heating/setpoints
  palette3: "AEMS Vibrant Harmony", // Tertiary: vibrant diverging for status/efficiency
  paletteWarm: "Red", // Warm: heating-related colors
  paletteCool: "Blue", // Cool: cooling-related colors
  paletteGradient: "Turquoise", // Gradient: gradient-based metrics
};

export const isPreferences = (preferences: any): preferences is Preferences => {
  return (
    typeof preferences === "object" &&
    "theme" in preferences &&
    "mode" in preferences &&
    [Mode.Light, Mode.Dark].includes(preferences.mode)
  );
};

export function compilePreferences<
  T extends ClientPreferences,
  S extends ServerPreferences,
  P extends PrismaPreferences,
>(...preferences: (Partial<T> | Partial<S> | Partial<P> | null | undefined)[]): Preferences & T & S & P {
  return deepMerge({}, DefaultPreferences, ...preferences) as unknown as Preferences & T & S & P;
}

function getLocalStorage(): Preferences | undefined {
  const value = localStorage.getItem(`preferences`);
  if (!value) return undefined;
  const preferences = JSON.parse(value);
  const sanitized = omit(preferences, SensitivePreferences);
  return isPreferences(sanitized) ? sanitized : undefined;
}

function setLocalStorage(preferences: Preferences) {
  const sanitized = omit(preferences, SensitivePreferences);
  localStorage.setItem(`preferences`, JSON.stringify(sanitized));
}

/**
 * Synchronously read the merged preferences from storage. Safe to call inside
 * a `useState` initializer in client components — falls back to defaults on
 * the server or when nothing is stored. The provider hydrates from the same
 * source on mount, so context catches up after first render.
 */
export function getStoredPreferences(): Preferences {
  if (typeof window === "undefined") return DefaultPreferences;
  return compilePreferences(getLocalStorage());
}

/**
 * Provider for preferences.
 */
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(DefaultPreferences);

  useEffect(() => {
    setPreferences(compilePreferences(getLocalStorage()));
  }, []);

  const setPreferencesWrapper: setPreferences = useCallback((preferences) => {
    const cleaned = omit(preferences, SensitivePreferences) as Omit<
      typeof preferences,
      (typeof SensitivePreferences)[number]
    >;
    setLocalStorage(cleaned);
    setPreferences(cleaned);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{
        preferences,
        setPreferences: setPreferencesWrapper,
      }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}
