"use client";

import { Suspense } from "react";
import styles from "./page.module.scss";
import { Card } from "@blueprintjs/core";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <Card>
        <Suspense>{children}</Suspense>
      </Card>
    </div>
  );
}
