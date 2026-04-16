"use client";

import { merge, omit } from "lodash";
import { createContext, useCallback, useEffect } from "react";
import { useState } from "react";
import { SensitivePreferences } from "./current";
import { Mode, Preferences as PrismaPreferences } from "@local/prisma";

export interface ClientPreferences {
  // Declare additional client-only preferences here
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
  // Set default values for additional client-only preferences here
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
  return merge({}, DefaultPreferences, ...preferences);
}

function getLocalStorage(): Preferences | undefined {
  const value = localStorage.getItem(`preferences`);
  const preferences = value ? JSON.parse(value) : undefined;
  const sanitized = omit(preferences, SensitivePreferences);
  return isPreferences(sanitized) ? sanitized : undefined;
}

function setLocalStorage(preferences: Preferences) {
  const sanitized = omit(preferences, SensitivePreferences);
  localStorage.setItem(`preferences`, JSON.stringify(sanitized));
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
