"use client";

import { Button, Callout, Classes, Intent } from "@blueprintjs/core";
import { useEffect, useMemo } from "react";
import styles from "./page.module.scss";
import { format } from "util";
import clsx from "clsx";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);

  const message = useMemo(() => format("%s", error.stack || error), [error]);

  return (
    <div className={styles.modal}>
      <div>
        <Callout intent={Intent.DANGER} title="Something went wrong!">
          <div className={clsx(Classes.RUNNING_TEXT, styles.code)}>
            <code>{message}</code>
          </div>
          <Button intent={Intent.PRIMARY} onClick={() => reset()}>
            Try again
          </Button>
        </Callout>
      </div>
    </div>
  );
}
