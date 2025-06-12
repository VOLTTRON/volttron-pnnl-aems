"use client";

import styles from "../../page.module.scss";
import { ReactNode } from "react";

export default function Page(props: { children: ReactNode }) {
  const { children } = props;
  return (
    <div className={styles.modal}>
      <div className={styles.login}>{children}</div>
    </div>
  );
}
