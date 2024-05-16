"use client";

import { useContext, useMemo } from "react";
import { LoadingContext, LoadingType } from "../providers/loading";

export default function Loading() {
  const { loadings } = useContext(LoadingContext);

  const loading = useMemo(
    () =>
      loadings
        ?.filter((v) => v.type === LoadingType.GLOBAL)
        .sort((a, b) => b.timestamp - a.timestamp)
        .pop(),
    [loadings]
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="loading__content">
          <div className="loading__spinner"></div>
          <div className="loading__text">Loading...</div>
        </div>
      </div>
    );
  } else {
    return null;
  }
}
