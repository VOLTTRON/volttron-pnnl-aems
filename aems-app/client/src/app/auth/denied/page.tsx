"use server";

import styles from "../page.module.scss";
import { Callout, Intent } from "@blueprintjs/core";

export default async function Page() {
  if (process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    return (
      <div className={styles.modal}>
        <div className={styles.denied}>
          <Callout title="Access Denied" intent={Intent.WARNING}>
            <p>
              You must be granted access in order to use this web application. <br />
              Request access to this application at:{" "}
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_ADMIN_EMAIL}?subject=Request Access to ${process.env.PROJECT_NAME}: ${window.location.hostname}`}
              >
                {process.env.NEXT_PUBLIC_ADMIN_EMAIL}
              </a>
            </p>
          </Callout>
        </div>
      </div>
    );
  } else {
    return (
      <div className={styles.modal}>
        <div className={styles.denied}>
          <Callout title="Access Denied" intent={Intent.WARNING}>
            <p>You must be granted access in order to use this web application.</p>
          </Callout>
        </div>
      </div>
    );
  }
}
