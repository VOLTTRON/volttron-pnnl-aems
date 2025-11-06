"use client";

import styles from "../page.module.scss";

import Login from "../[provider]/login/page";
import { useEffect, useState } from "react";
import { Credentials, ProviderInfo } from "@local/prisma";
import { useRouter } from "next/navigation";

const hiddenLogins = (process.env.NEXT_PUBLIC_HIDDEN_LOGINS ?? "").split(/[|:;, ]/);

export default function Page() {
  const [providers, setProviders] = useState<ProviderInfo<Credentials>[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_HTTP_API || "/api"}/auth`, { method: "GET" })
      .then((res) => res.json())
      .then((response) =>
        setProviders(
          Object.values((response as Record<string, ProviderInfo<Credentials>> | undefined) ?? {}).filter(
            (provider) => !hiddenLogins.includes(provider.name),
          ),
        ),
      );
  }, []);

  if (process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL) {
    return router.push(`${process.env.NEXT_PUBLIC_AUTHJS_LOGIN_URL}`);
  }

  return (
    <div className={styles.modal}>
      <div className={styles.login}>
        {providers.map((provider) => (
          <Login key={`login-${provider}`} params={Promise.resolve({ provider: provider.name })} />
        ))}
      </div>
    </div>
  );
}
