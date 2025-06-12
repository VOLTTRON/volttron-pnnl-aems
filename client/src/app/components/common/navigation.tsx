"use client";

import { Intent, Menu, MenuItem } from "@blueprintjs/core";
import { useRouter } from "next/navigation";
import React, { useCallback, useContext } from "react";
import { CurrentContext, findPath, isDisplay, RouteContext } from "../providers";
import { Route } from "../../types";
import { DefaultNode } from "@local/common";

function Items({
  routes,
  route,
  callback,
}: {
  routes: DefaultNode<Route>[];
  route: DefaultNode<Route> | undefined;
  callback: (url: string) => () => void;
}) {
  const { current } = useContext(CurrentContext);

  return (
    <>
      {routes.map((v) => {
        if (v.data) {
          const index = v.data.index;
          const display = isDisplay(v, current ?? {});
          if (display && v.children.filter((c) => c.data?.display).length > 0) {
            return (
              <MenuItem
                key={v.data.id}
                icon={v.data.icon}
                text={v.data.name}
                intent={route?.isAncestor(v) || route?.data?.id === v.data?.id ? Intent.PRIMARY : undefined}
                onClick={!index ? callback(findPath(v)) : undefined}
              >
                <Items routes={v.children} route={route} callback={callback} />
              </MenuItem>
            );
          } else if (display && !index) {
            return (
              <MenuItem
                key={v.data.id}
                icon={v.data.icon}
                text={v.data.name}
                intent={route?.isAncestor(v) || route?.data?.id === v.data?.id ? Intent.PRIMARY : undefined}
                onClick={callback(findPath(v))}
              />
            );
          } else if (v.children.length > 0) {
            return <Items key={v.data.id} routes={v.children} route={route} callback={callback} />;
          }
        }
      })}
    </>
  );
}

export function Navigation() {
  const { routes, route } = useContext(RouteContext);
  const router = useRouter();

  const callback = useCallback(
    (url: string) => {
      return () => router.push(url);
    },
    [router],
  );

  return (
    <Menu>
      <Items routes={[routes.root]} route={route} callback={callback} />
    </Menu>
  );
}
