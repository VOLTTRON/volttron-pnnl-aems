"use client";

import { CurrentContext, LoadingContext, LoadingType, RouteContext } from "@/app/components/providers";
import styles from "../page.module.scss";
import { useApolloClient } from "@apollo/client";
import { Button, Callout, Card, FormGroup, Intent } from "@blueprintjs/core";
import { useRouter } from "next/navigation";
import { useContext, useState } from "react";
import { findPath, findRedirect } from "@/app/components/providers";
import { IconNames } from "@blueprintjs/icons";

export default function Page() {
  const [error, setError] = useState<string | undefined>(undefined);

  const { refetchCurrent } = useContext(CurrentContext);
  const { createLoading, clearLoading } = useContext(LoadingContext);
  const { routes } = useContext(RouteContext);
  const client = useApolloClient();
  const router = useRouter();

  function formAction(_formData: FormData) {
    setError(undefined);
    const loading = createLoading?.(LoadingType.GLOBAL);
    try {
      fetch(`${process.env.NEXT_PUBLIC_HTTP_API || "/api"}/auth/logout`, { method: "POST", redirect: "follow" })
        .then(async (res) => {
          await client.clearStore();
          await refetchCurrent?.();
          if (res.redirected) {
            router.push(res.url);
          } else if (res.ok) {
            router.push(findPath(findRedirect(routes, { role: "" }) ?? routes.root) || "/");
          } else {
            console.log("Failed to log out: ", res);
            setError("Failed to log out: " + (res.statusText ?? res.status ?? "Unknown error"));
          }
        })
        .finally(() => loading && clearLoading?.(loading));
    } catch (e: any) {
      console.error("Error while attempting to log out: ", e);
      setError("Error while attempting to log out: " + e.message);
      loading && clearLoading?.(loading);
    }
  }

  return (
    <div className={styles.modal}>
      <div className={styles.logout}>
        <Card>
          <form action={formAction}>
            <FormGroup label={<h3>Sign out</h3>} />
            <Button type="submit" intent={Intent.PRIMARY}>
              Continue
            </Button>
          </form>
          {error && (
            <Callout intent={Intent.DANGER} icon={IconNames.WARNING_SIGN}>
              {error}
            </Callout>
          )}
        </Card>
      </div>
    </div>
  );
}
