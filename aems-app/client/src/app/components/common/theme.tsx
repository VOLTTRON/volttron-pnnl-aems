"use client";

import styles from "./page.module.scss";
import React, { useContext, useEffect } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../providers";
import { Classes } from "@blueprintjs/core";
import clsx from "clsx";
import { Mode } from "@local/prisma";

export function Theme({ children }: { children: React.ReactNode }) {
  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  useEffect(() => {
    if (document.body.classList.contains(Classes.DARK) !== (mode === Mode.Dark)) {
      switch (mode) {
        case Mode.Dark:
          document.body.classList.add(Classes.DARK);
          break;
        case Mode.Light:
        default:
          document.body.classList.remove(Classes.DARK);
          break;
      }
    }
  }, [mode]);

  return <div className={clsx({ [styles.dark]: mode === Mode.Dark })}>{children}</div>;
}
