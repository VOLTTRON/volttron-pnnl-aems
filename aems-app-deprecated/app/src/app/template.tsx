"use client";

import styles from "./page.module.scss";

import { redirect, useSearchParams } from "next/navigation";
import { Suspense, useContext } from "react";
import { Alignment, Navbar, NavbarGroup } from "@blueprintjs/core";
import { CurrentContext, findPath, isGranted, RouteContext } from "./components/providers";
import { GlobalLoading, NavbarLeft, NavbarRight, Navigation } from "./components/common";
import { ComponentLocation, RouteComponent } from "./types";
import clsx from "clsx";
import type { Metadata } from "next";
import NotFound from "./not-found";
import { FeedbackWidget } from "./components/feedback";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_TITLE,
  description: process.env.NEXT_PUBLIC_DESCRIPTION,
  keywords: process.env.NEXT_PUBLIC_KEYWORDS,
};

function getComponent(component: RouteComponent) {
  switch (component) {
    case RouteComponent.NAVBAR_LEFT:
      return NavbarLeft;
    case RouteComponent.NAVBAR_RIGHT:
      return NavbarRight;
    case RouteComponent.NAVIGATION:
      return Navigation;
    default:
      return null;
  }
}

export default function Template({ children }: { children: React.ReactNode }) {
  const { route } = useContext(RouteContext);
  const { current, loading } = useContext(CurrentContext);

  const searchParams = useSearchParams();
  
  if (loading) {
    return <GlobalLoading />;
  } else if (!route) {
    return <NotFound />;
  } else if (current && !isGranted(route, current)) {
    return redirect("/auth/denied");
  } else if (!current && !isGranted(route, {})) {
    return redirect(`/auth/login?redirect=${findPath(route)}${searchParams ? `?${searchParams}` : ""}`);
  }

  const { NavbarLeft, NavbarRight, Navigation } = Object.entries(route.data?.components ?? {}).reduce((p, [k, v]) => {
    const component = getComponent(v as RouteComponent);
    if (component) {
      p[k as ComponentLocation] = component;
    }
    return p;
  }, {} as Record<ComponentLocation, React.ComponentType>);
  const isNavbar = !!NavbarLeft || !!NavbarRight;
  const isNavigation = !!Navigation;

  return (
    <Suspense>
      {isNavbar && (
        <Navbar fixedToTop>
          {NavbarLeft && (
            <NavbarGroup align={Alignment.LEFT}>
              <NavbarLeft />
            </NavbarGroup>
          )}
          {NavbarRight && (
            <NavbarGroup align={Alignment.RIGHT}>
              {" "}
              <NavbarRight />
            </NavbarGroup>
          )}
        </Navbar>
      )}
      <div className={clsx(styles.main, { [styles.navbar]: isNavbar })}>
        {isNavigation && (
          <div className={styles.navigation}>
            <Navigation />
          </div>
        )}
        <FeedbackWidget />
        <div className={styles.content}>{children}</div>
      </div>
    </Suspense>
  );
}
