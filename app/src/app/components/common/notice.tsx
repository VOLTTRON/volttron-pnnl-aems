"use client";

import styles from "./page.module.scss";
import React, { useState } from "react";
import { Button, Dialog, DialogBody, DialogFooter, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";

export function Notice() {
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <Dialog
      className={styles.notice}
      icon={IconNames.WARNING_SIGN}
      title="System Use Notice"
      isOpen={!acknowledged}
      isCloseButtonShown={false}
    >
      <DialogBody>
        <p>
          <strong>{`**************************WARNING**************************`}</strong>
        </p>
        <p>
          {`This is a U.S. General Services Administration Federal Government
computer system that is "FOR OFFICIAL USE ONLY." This system is
subject to monitoring. Therefore, no expectation of privacy is to be
assumed. Individuals found performing unauthorized activities are
subject to disciplinary action including criminal prosecution.`}
        </p>
      </DialogBody>
      <DialogFooter>
        <Button intent={Intent.PRIMARY} onClick={() => setAcknowledged(true)}>
          Acknowledge
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
