"use client";

import { Classes, Icon, IconProps } from "@blueprintjs/core";
import styles from "./page.module.scss";
import clsx from "clsx";

export function TextIcon({ text, color, iconProps }: { text: string; color?: string; iconProps?: Partial<IconProps> }) {
  const width = Math.max(30, text.length * 10 + 10);
  return (
    <Icon
      icon={
        <span aria-hidden="true" className={clsx(Classes.ICON, styles.iconText, { [styles.iconRect]: !color })}>
          <svg width={width} height="30" viewBox={`0 0 ${width} 30`} role="img">
            <rect x="4px" y="4px" width={`${width - 8}`} height="22" rx={5} {...(color && { fill: color })} />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle">
              {text}
            </text>
          </svg>
        </span>
      }
      {...iconProps}
    />
  );
}
