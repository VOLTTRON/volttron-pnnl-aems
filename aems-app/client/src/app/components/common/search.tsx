"use client";

import { Button, Icon, InputGroup, InputGroupProps, Intent } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import styles from "./page.module.scss";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { debounce } from "lodash";

export function Search({
  loading,
  debounced,
  ...props
}: {
  loading?: boolean;
  debounced?: { search: string; setSearch: Dispatch<SetStateAction<string>>; delay?: number };
} & InputGroupProps) {
  const { value, onValueChange, ...inputProps } = props;
  const [search, setSearch] = useState(debounced?.search ?? props.value ?? "");

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onValueChangeDebounced = useCallback(
    debounce((v: string) => debounced?.setSearch(v), debounced?.delay ?? 400),
    [debounced],
  );

  useEffect(() => {
    onValueChangeDebounced(search);
  }, [onValueChangeDebounced, search]);

  const clearSearch = useCallback(() => {
    if (debounced) {
      setSearch("");
    } else {
      onValueChange?.("", null);
    }
  }, [debounced, onValueChange]);

  return (
    <InputGroup
      {...inputProps}
      value={debounced ? search : value}
      onValueChange={debounced ? setSearch : onValueChange}
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
