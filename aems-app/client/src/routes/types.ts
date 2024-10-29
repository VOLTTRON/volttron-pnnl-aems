import { IconName } from "@blueprintjs/icons";
import { LazyExoticComponent } from "react";

interface RouteType {
  id: number;
  parentId: number | undefined;
  name: React.Key;
  label: string;
  description?: string;
  brief?: string;
  keywords?: Array<string>;
  path: string | undefined;
  element: LazyExoticComponent<(props?: any) => JSX.Element>;
  icon?: IconName;
  footer?: boolean;
  user?: boolean;
  admin?: boolean;
  hidden?: boolean;
  buildProps?: any;
}

export type { RouteType };
