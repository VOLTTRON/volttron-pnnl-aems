"use client";

import { Button, Icon, InputGroup, InputGroupProps, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import styles from "./page.module.scss";

export function Search({ loading, ...props }: { loading?: boolean } & InputGroupProps) {
  function clearSearch() {
    props.onValueChange?.("", null);
  }

  return (
    <InputGroup
      {...props}
      leftIcon={loading ? <Icon className={styles.spin} icon={IconNames.REFRESH} /> : IconNames.SEARCH}
      rightElement={
        <Button
          icon={<Icon icon={IconNames.CROSS} size={16} />}
          minimal
          intent={props.value?.length ? Intent.PRIMARY : Intent.NONE}
          onClick={clearSearch}
          disabled={props.value?.length === 0}
        />
      }
    />
  );
}
