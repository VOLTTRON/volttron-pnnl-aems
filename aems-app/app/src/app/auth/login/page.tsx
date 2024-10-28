"use client";

import styles from "../page.module.scss";

import Login from "../[provider]/login/page";
import { useEffect, useState } from "react";

const hiddenLogins = (process.env.NEXT_PUBLIC_HIDDEN_LOGINS ?? "").split(/[|:;, ]/);

export default function Page() {
  const [providers, setProviders] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/auth`, { method: "GET" })
      .then((res) => res.json())
      .then(({ providers }) =>
        setProviders(((providers as string[] | undefined) ?? []).filter((provider) => !hiddenLogins.includes(provider)))
      );
  }, []);

  return (
    <div className={styles.modal}>
      <div className={styles.login}>
        {providers.map((provider) => (
          <Login key={`login-${provider}`} params={{ provider }} />
        ))}
      </div>
    </div>
  );
}
