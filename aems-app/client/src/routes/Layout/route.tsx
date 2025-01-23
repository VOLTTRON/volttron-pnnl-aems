import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 0,
  parentId: undefined,
  name: "Layout",
  label: "Layout",
  path: undefined,
  element: Element,
  user: false,
  admin: false,
  hidden: true,
};

export default route;
