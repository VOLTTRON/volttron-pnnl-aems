import { RouteType } from "routes/types";
import { lazy } from "react";

const Element = lazy(() => import("./index"));

const route: RouteType = {
  id: 6000,
  parentId: 0,
  name: "account",
  label: "Account",
  path: "account",
  element: Element,
  footer: false,
  user: true,
  admin: false,
  hidden: false,
};

export default route;
