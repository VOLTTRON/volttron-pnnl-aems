import styles from "@/app/sample/page.module.css";
import { getProviders } from "@/auth";

import Login from "../[provider]/login/page";

export default async function Page() {
  const providers = getProviders();
  return (
    <main className={styles.main}>
      <ul>
        {providers.map((p) => (
          <li key={p}>
            <Login key={p} params={{ provider: p }} />
          </li>
        ))}
      </ul>
    </main>
  );
}
