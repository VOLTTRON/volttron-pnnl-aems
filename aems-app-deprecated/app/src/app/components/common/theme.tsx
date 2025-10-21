"use client";

import styles from "./page.module.scss";
import React, { useContext, useEffect } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../providers";
import { Classes } from "@blueprintjs/core";
import clsx from "clsx";

export function Theme({ children }: { children: React.ReactNode }) {
  const { preferences } = useContext(PreferencesContext);
  const { current } = useContext(CurrentContext);

  const { mode } = compilePreferences(preferences, current?.preferences);

  useEffect(() => {
    if (document.body.classList.contains(Classes.DARK) !== (mode === "dark")) {
      switch (mode) {
        case "dark":
          document.body.classList.add(Classes.DARK);
          break;
        case "light":
        default:
          document.body.classList.remove(Classes.DARK);
          break;
      }
    }
  }, [mode]);

  return <div className={clsx({ [styles.dark]: mode === "dark" })}>{children}</div>;
}
