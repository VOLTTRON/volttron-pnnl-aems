"use client";

import Link from "next/link";
import styles from "./page.module.scss";
import { Button, Callout, Classes, Intent } from "@blueprintjs/core";
import { useContext } from "react";
import { CurrentContext, findPath, findRedirect, findRoute, isGranted, RouteContext } from "./components/providers";
import { usePathname, useRouter } from "next/navigation";
import { staticRoutes } from "./routes";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  let { routes, route } = useContext(RouteContext);
  const { current } = useContext(CurrentContext);

  routes = routes ?? staticRoutes;
  route = route ?? findRoute(routes, pathname ?? "");

  let title = "Not Found";
  let message = "Could not find requested resource";
  let action = <Link href="/">Return Home</Link>;
  if (route?.data !== undefined) {
    const goto = findRedirect(routes, current ?? {});
    const login = routes.findNode("login");
    if (!isGranted(route, current ?? {})) {
      title = "Access Denied";
      message = "You do not have permission to access this resource";
      if (login !== undefined) {
        action = <Button onClick={() => router.push(findPath(login))}>Login</Button>;
      }
    } else if (!route.data.display && goto !== undefined) {
      title = "Redirecting";
      message = "Redirecting to a suitable page";
      action = <Button onClick={() => router.push(findPath(goto))}>Continue</Button>;
    }
  }
  return (
    <div className={styles.modal}>
      <div>
        <Callout intent={Intent.WARNING} title={title}>
          <div className={Classes.RUNNING_TEXT}>
            <h3>
              <strong>{message}</strong>
            </h3>
            {action}
          </div>
        </Callout>
      </div>
    </div>
  );
}
