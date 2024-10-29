import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 200,
  parentId: undefined,
  name: "NotFound",
  label: "Not Found",
  path: "*",
  icon: "error",
  element: Element,
  hidden: true,
};

export default route;
