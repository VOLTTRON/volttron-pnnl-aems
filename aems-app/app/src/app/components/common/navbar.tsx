"use client";

import { Breadcrumbs, NavbarDivider, NavbarHeading } from "@blueprintjs/core";
import { useRouter } from "next/navigation";
import { useCallback, useContext, useState } from "react";
import { RouteContext, CurrentContext, findPath, PreferencesContext, compilePreferences } from "../providers";
import { Menu, MenuItem, PopoverPosition } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { Preferences } from "./preferences";

export function NavbarLeft() {
  const { route } = useContext(RouteContext);
  const router = useRouter();

  const callback = useCallback(
    (url: string) => {
      return () => router.push(url);
    },
    [router]
  );

  let items = [];
  if (route) {
    items.push(route);
    let parent = route.parent;
    while (parent) {
      items.unshift(parent);
      parent = parent.parent;
    }
  }
  items = items.map((v) => ({ text: v.data?.name, icon: v.data?.icon, onClick: callback(findPath(v)) }));

  return (
    <>
      <NavbarHeading>
        <h3>{process.env.NEXT_PUBLIC_TITLE}</h3>
      </NavbarHeading>
      <NavbarDivider />
      <Breadcrumbs items={items} />
    </>
  );
}

export function NavbarRight() {
  const [open, setOpen] = useState("");

  const { preferences, setPreferences } = useContext(PreferencesContext);
  const { current, updateCurrent } = useContext(CurrentContext);
  const { mode, name } = compilePreferences(preferences, current?.preferences);

  const router = useRouter();

  const callback = useCallback(
    (url: string) => {
      return () => router.push(url);
    },
    [router]
  );

  function renderMode() {
    const dark = mode === "dark";
    return (
      <MenuItem
        icon={dark ? IconNames.FLASH : IconNames.MOON}
        text={dark ? "Light Mode" : "Dark Mode"}
        onClick={() => {
          const payload = compilePreferences(preferences, current?.preferences, { mode: dark ? "light" : "dark" });
          if (preferences) {
            setPreferences?.(payload);
          }
          if (current) {
            updateCurrent?.({ preferences: payload });
          }
        }}
      />
    );
  }

  if (current) {
    return (
      <>
        {open === "preferences" && <Preferences handleClose={() => setOpen("")} />}
        <Menu>
          <MenuItem
            icon={IconNames.USER}
            text={name || current.name}
            popoverProps={{ placement: PopoverPosition.BOTTOM }}
          >
            <MenuItem icon={IconNames.LOG_OUT} text="Logout" onClick={callback("/auth/logout")} />
            <MenuItem icon={IconNames.COG} text="Preferences" onClick={() => setOpen("preferences")} />
            {renderMode()}
          </MenuItem>
        </Menu>
      </>
    );
  } else {
    return (
      <>
        <Menu>
          <MenuItem icon={IconNames.USER} text="Guest" popoverProps={{ placement: PopoverPosition.BOTTOM }}>
            <MenuItem icon={IconNames.LOG_IN} text="Login" onClick={callback("/auth/login")} />
            {renderMode()}
          </MenuItem>
        </Menu>
      </>
    );
  }
}
