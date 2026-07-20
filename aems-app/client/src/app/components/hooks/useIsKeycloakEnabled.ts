"use client";

import { useEffect, useState } from "react";

let cachedProviders: string[] | null = null;

async function fetchEnabledProviders(): Promise<string[]> {
  if (cachedProviders !== null) return cachedProviders;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_HTTP_API || "/api"}/auth`, { method: "GET" });
    const data = (await res.json()) as Record<string, { name: string }>;
    cachedProviders = Object.values(data).map((p) => p.name);
  } catch {
    cachedProviders = [];
  }
  return cachedProviders;
}

export function useIsKeycloakEnabled(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    void fetchEnabledProviders().then((providers) => {
      setEnabled(providers.includes("keycloak"));
    });
  }, []);

  return enabled;
}
