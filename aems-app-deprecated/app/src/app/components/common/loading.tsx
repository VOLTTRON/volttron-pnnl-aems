"use client";

import styles from "./page.module.scss";
import { useContext, useMemo } from "react";
import { Intent, Spinner } from "@blueprintjs/core";
import { LoadingContext, LoadingType } from "../providers/loading";

export function LocalLoading() {
  return (
    <div className={styles.loading}>
      <Spinner intent={Intent.PRIMARY} />
    </div>
  );
}

export function GlobalLoading() {
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
      <div className={styles.modal}>
        <Spinner intent={Intent.PRIMARY} />
      </div>
    );
  } else {
    return null;
  }
}
