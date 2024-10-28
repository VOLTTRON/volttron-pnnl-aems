import { IconNames } from "@blueprintjs/icons";
import { ComponentLocation, Route, RouteComponent } from "./types";
import { deepFreeze } from "@/utils/util";
import { buildTree } from "@/utils/tree";

const hiddenRoutes = (process.env.NEXT_PUBLIC_HIDDEN_ROUTES ?? "").split(/[|:;, ]/);

const components: Partial<Record<ComponentLocation, RouteComponent>> =
  process.env.NODE_ENV !== "test"
    ? {
        [ComponentLocation.NAVBAR_LEFT]: RouteComponent.NAVBAR_LEFT,
        [ComponentLocation.NAVBAR_RIGHT]: RouteComponent.NAVBAR_RIGHT,
        [ComponentLocation.NAVIGATION]: RouteComponent.NAVIGATION,
      }
    : {};

const routes: Readonly<Route[]> = [
  {
    id: "home",
    parentId: undefined,
    path: `/`,
    index: true,
    name: "Home",
    icon: IconNames.HOME,
    display: true,
    components: components,
  },
  {
    id: "about",
    parentId: "home",
    path: `about`,
    name: "About",
    icon: IconNames.INFO_SIGN,
    display: true,
    components: components,
  },
  {
    id: "demo",
    parentId: "home",
    path: `demo`,
    name: "Demo",
    icon: IconNames.LAB_TEST,
    scope: "user",
    display: true,
    components: components,
  },
  {
    id: "feedback",
    parentId: "home",
    path: `feedback`,
    name: "Feedback",
    icon: IconNames.COMMENT,
    scope: "admin",
    display: "admin",
    components: components,
  },
  {
    id: "users",
    parentId: "home",
    path: `users`,
    name: "Users",
    icon: IconNames.USER,
    scope: "admin",
    display: "admin",
    components: components,
  },
  {
    id: "banners",
    parentId: "home",
    path: `banners`,
    name: "Banners",
    icon: IconNames.NOTIFICATIONS,
    scope: "admin",
    display: "admin",
    components: components,
  },
  {
    id: "logs",
    parentId: "home",
    path: `logs`,
    name: "Logs",
    icon: IconNames.CONSOLE,
    scope: "admin",
    display: "admin",
    components: components,
  },
  {
    id: "auth",
    parentId: "home",
    path: `auth`,
    name: "Auth",
    icon: IconNames.USER,
    index: true,
  },
  {
    id: "login",
    parentId: "auth",
    path: `login`,
    name: "Login",
    icon: IconNames.LOG_IN,
  },
  {
    id: "logout",
    parentId: "auth",
    path: `logout`,
    name: "Logout",
    icon: IconNames.LOG_OUT,
  },
  {
    id: "denied",
    parentId: "auth",
    path: `denied`,
    name: "Access Denied",
    icon: IconNames.STOP,
  },
];

export const staticRoutes = buildTree(
  deepFreeze(
    routes.map((v) => {
      v.display = hiddenRoutes.includes(v.id) ? false : v.display;
      return v;
    })
  )
);
