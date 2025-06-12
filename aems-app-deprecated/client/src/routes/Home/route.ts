import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 1000,
  parentId: 0,
  name: "Home",
  label: "Home",
  path: "/",
  element: Element,
  footer: false,
  user: false,
  admin: false,
  hidden: false,
};

export default route;
