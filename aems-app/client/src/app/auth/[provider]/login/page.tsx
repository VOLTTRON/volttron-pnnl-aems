"use client";

import {
  CurrentContext,
  LoadingContext,
  LoadingType,
  NotificationContext,
  NotificationType,
} from "@/app/components/providers";
import { Credentials, ProviderInfo } from "@local/common";
import { Button, Callout, Card, FormGroup, InputGroup, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";

export default function Page(props: { params: Promise<{ provider: string }> }) {
  const [error, setError] = useState<string | undefined>(undefined);

  const { refetchCurrent } = useContext(CurrentContext);
  const { createLoading, clearLoading } = useContext(LoadingContext);
  const { createNotification } = useContext(NotificationContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [provider, setProvider] = useState<ProviderInfo<Credentials> | null>(null);
  const { name, label } = provider ?? {};

  useEffect(() => {
    props.params
      .then(({ provider }) =>
        fetch(`${process.env.NEXT_PUBLIC_HTTP_API || "/api"}/auth`, { method: "GET" })
          .then(async (res) => (await res.json()) as Record<string, ProviderInfo<Credentials>>)
          .then((response) => setProvider((response[provider] as ProviderInfo<Credentials>) || null))
          .catch((e) => createNotification?.("Failed to fetch provider info. " + e.message, NotificationType.Error)),
      )
      .catch((e) => createNotification?.("Failed to determine provider type. " + e.message, NotificationType.Error));
  }, [props.params, createNotification]);

  function formAction(formData: FormData) {
    setError(undefined);
    const loading = createLoading?.(LoadingType.GLOBAL);
    try {
      const body = Array.from(formData.entries()).reduce((p, [name, value]) => ({ ...p, [name]: value }), {});
      fetch(`${process.env.NEXT_PUBLIC_HTTP_API || "/api"}${provider?.endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        redirect: "follow",
        body: JSON.stringify(body),
      })
        .then(async (res) => {
          await refetchCurrent?.();
          if (res.redirected) {
            router.push(res.url);
          } else if (res.ok) {
            router.push(searchParams.get("redirect") || "/");
          } else {
            const body = await res.json();
            console.log("Failed to log in: ", { ...res, body });
            setError(
              "Failed to log in: " +
                (body?.error || body?.statusText || (res.statusText ?? res.status ?? "Unknown error")),
            );
          }
        })
        .finally(() => loading && clearLoading?.(loading));
    } catch (e: any) {
      console.error("Error while attempting to log in: ", e);
      setError("Error while attempting to log in: " + e.message);
      loading && clearLoading?.(loading);
    }
  }

  return (
    <Card>
      <form action={formAction}>
        <FormGroup label={<h3>{label} Sign in</h3>}>
          {Object.entries(provider?.credentials ?? []).map(([name, { label, type, placeholder }]) => {
            switch (type) {
              case "text":
                return (
                  <FormGroup key={`label-${name}`} label={label} labelFor={name}>
                    <InputGroup key={`input-${name}`} name={name} id={name} placeholder={placeholder} required />
                  </FormGroup>
                );
              case "password":
                return (
                  <FormGroup key={`label-${name}`} labelFor={name} label={label}>
                    <InputGroup
                      key={`input-${name}`}
                      type="password"
                      name={name}
                      id={name}
                      placeholder={placeholder}
                      required
                    />
                  </FormGroup>
                );
              default:
                throw new Error(`Unknown credential type: ${type}`);
            }
          })}
          <Button type="submit" disabled={!provider} intent={Intent.PRIMARY}>
            Continue
          </Button>
        </FormGroup>
      </form>
      {error && (
        <Callout intent={Intent.DANGER} icon={IconNames.WARNING_SIGN}>
          {error}
        </Callout>
      )}
    </Card>
  );
}
