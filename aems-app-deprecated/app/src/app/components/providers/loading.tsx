"use client";

import { difference, union } from "lodash";
import { createContext, useCallback, useState } from "react";

export type CreateLoading = (type?: LoadingType) => Loading;

export type ClearLoading = (value: Loading) => void;

export enum LoadingType {
  LOCAL,
  GLOBAL,
}

export interface Loading {
  readonly id: string;
  readonly timestamp: number;
  readonly type: LoadingType;
}

export class LoadingModel implements Loading {
  private static number = 0;
  readonly id: string;
  readonly timestamp: number;
  readonly type: LoadingType;

  constructor(type = LoadingType.LOCAL) {
    this.id = `Loading-${++LoadingModel.number}`;
    this.timestamp = new Date().getTime();
    this.type = type;
  }
}

export const LoadingContext = createContext<{
  loadings?: Loading[];
  clearLoading?: ClearLoading;
  createLoading?: CreateLoading;
}>({});

function loadingBuilder(t?: LoadingType): Loading {
  return new LoadingModel(t);
}

/**
 * Provider for loading states.
 */
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadings, setLoadings] = useState([] as Loading[]);

  const clearLoading: ClearLoading = useCallback((v) => setLoadings(difference(loadings, [v])), [loadings]);

  const createLoading: CreateLoading = useCallback(
    (t) => {
      const loading = loadingBuilder(t);
      setLoadings(union(loadings, [loading]));
      return loading;
    },
    [loadings]
  );

  return (
    <LoadingContext.Provider value={{ loadings, clearLoading, createLoading }}>{children}</LoadingContext.Provider>
  );
}
