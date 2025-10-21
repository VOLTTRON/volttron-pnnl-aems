import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 3500,
  parentId: 0,
  name: "Control",
  label: "ILC",
  path: "control",
  element: Element,
  footer: false,
  user: true,
  admin: true,
  hidden: false,
};

export default route;
