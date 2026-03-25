"use client";

import { merge, omit } from "lodash";
import { createContext, useCallback, useEffect } from "react";
import { useState } from "react";
import { SensitivePreferences } from "./current";
import { Mode, Preferences as ServerPreferences } from "@local/prisma";

export type Preferences = Omit<ServerPreferences, (typeof SensitivePreferences)[number]> & {
  palette1?: string; // Primary palette (temperatures, main metrics)
  palette2?: string; // Secondary palette (setpoints, demands)
  palette3?: string; // Tertiary palette (status, states)
};

export type setPreferences = (preferences: Preferences) => void;

export const PreferencesContext = createContext<{
  preferences?: Preferences;
  setPreferences?: setPreferences;
}>({});

export const DefaultPreferences: Preferences = {
  theme: "default",
  mode: Mode.Light,
  palette1: "Radiant Harmony", // Primary: vibrant diverging
  palette2: "Desert Oasis", // Secondary: earthy diverging
  palette3: "Pastel Dreams", // Tertiary: soft diverging
};

export const isPreferences = (preferences: any): preferences is Preferences => {
  return (
    typeof preferences === "object" &&
    "theme" in preferences &&
    "mode" in preferences &&
    [Mode.Light, Mode.Dark].includes(preferences.mode)
  );
};

export function compilePreferences<T extends Preferences, S extends ServerPreferences>(
  ...preferences: (Partial<T> | Partial<S> | null | undefined)[]
): T & S {
  return merge({}, DefaultPreferences, ...preferences);
}

function getLocalStorage(): Preferences | undefined {
  const value = localStorage.getItem("preferences");
  const preferences = value ? JSON.parse(value) : undefined;
  return isPreferences(preferences) ? preferences : undefined;
}

function setLocalStorage(preferences: Preferences) {
  localStorage.setItem("preferences", JSON.stringify(preferences));
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
