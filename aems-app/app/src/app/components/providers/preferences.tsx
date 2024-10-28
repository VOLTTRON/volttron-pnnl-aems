"use client";

import { merge, omit } from "lodash";
import { createContext, useCallback, useEffect } from "react";
import { useState } from "react";
import { SensitivePreferences, UserPreferences } from "./current";

export type setPreferences = (preferences: Preferences) => void;

export const PreferencesContext = createContext<{
  preferences?: Preferences;
  setPreferences?: setPreferences;
}>({});

export interface Preferences {
  theme: string;
  mode: "light" | "dark";
}

export const DefaultPreferences: Preferences = {
  theme: "default",
  mode: "light" as const,
};

export const isPreferences = (preferences: any): preferences is Preferences => {
  return (
    typeof preferences === "object" &&
    "theme" in preferences &&
    "mode" in preferences &&
    ["light", "dark"].includes(preferences.mode)
  );
};

export function compilePreferences<T extends Preferences, S extends UserPreferences>(
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
