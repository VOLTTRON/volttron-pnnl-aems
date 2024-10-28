import { IconName } from "@blueprintjs/icons";

export enum DialogType {
  Create = "create",
  Read = "read",
  Update = "update",
  Delete = "delete",
  Confirm = "confirm",
  View = "view",
}

/**
 * ComponentLocation is an enumeration for the location of where components can be rendered for a route.
 */
export enum ComponentLocation {
  NAVBAR_LEFT = "NavbarLeft",
  NAVBAR_CENTER = "NavbarCenter",
  NAVBAR_RIGHT = "NavbarRight",
  NAVIGATION = "Navigation",
}

/**
 * RouteComponent is an enumeration of the components that can be rendered for a route.
 */
export enum RouteComponent {
  NAVBAR_LEFT = "NavbarLeft",
  NAVBAR_CENTER = "NavbarCenter",
  NAVBAR_RIGHT = "NavbarRight",
  NAVIGATION = "Navigation",
}

/**
 * Route is a data structure that represents a route in the application.
 */
export interface Route {
  /**
   * Id is the unique identifier of the route.
   */
  id: string;
  /**
   * ParentId is the identifier of the parent route.
   */
  parentId: string | undefined;
  /**
   * Path is the URL path that the route will be associated with.
   * The root path must be `/` and all other paths are relative to it and should not include any `/`.
   */
  path: string;
  /**
   * Name is a human-readable label for the route.
   */
  name: string;
  /**
   * Index is a route without an associated page and is used only for organization.
   */
  index?: boolean;
  /**
   * Scope is a single role that is allowed to access the route.
   */
  scope?: string;
  /**
   * Icon that will be associated with the route.
   */
  icon?: IconName;
  /**
   * Display determines whether the route is shown in the navigation.
   * Can either be true for always shown or a single role that it will display for.
   */
  display?: boolean | string;
  /**
   * Components that are rendered for the route.
   */
  components?: Partial<Record<ComponentLocation, RouteComponent>>;
}
