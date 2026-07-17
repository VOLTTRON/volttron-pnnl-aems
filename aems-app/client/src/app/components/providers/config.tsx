"use client";

import { ReadConfigDocument, ReadConfigQuery } from "@/graphql-codegen/graphql";
import { useQuery } from "@apollo/client";
import { createContext } from "react";

export type ServerConfig = ReadConfigQuery["readConfig"];

export const ConfigContext = createContext<{
  config?: ServerConfig;
  loading: boolean;
}>({ loading: true });

/**
 * Provider for whitelisted server-side configuration flags.
 */
export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const { data, loading } = useQuery(ReadConfigDocument, { fetchPolicy: "cache-first" });
  return (
    <ConfigContext.Provider value={{ config: data?.readConfig, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}
