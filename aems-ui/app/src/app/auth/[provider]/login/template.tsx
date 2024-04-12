import styles from "@/app/sample/page.module.css";
import { ReactNode } from "react";

export default async function Page(props: { children: ReactNode }) {
  const { children } = props;
  return <main className={styles.main}>{children}</main>;
}
