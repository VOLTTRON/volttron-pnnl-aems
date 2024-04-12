import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 3000,
  parentId: 0,
  name: "units",
  label: "Units",
  path: "units",
  element: Element,
  footer: false,
  user: true,
  admin: false,
  hidden: false,
};

export default route;
