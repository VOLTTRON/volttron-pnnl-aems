import { IBase, IGranted, IRole, RoleEnum } from ".";
import Base from "./base";
import { deepMerge } from "../utils/util";

class Role extends Base<IRole> implements IBase<IRole> {
  constructor() {
    super(
      [
        {
          name: "super",
          label: "Super",
          grants: [],
          enum: RoleEnum.Super,
        },
        {
          name: "admin",
          label: "Admin",
          grants: ["user"],
          enum: RoleEnum.Admin,
        },
        {
          name: "user",
          label: "User",
          grants: [],
          enum: RoleEnum.User,
        },
        {
          name: "keycloak",
          label: "Keycloak",
          grants: ["admin", "user"],
          enum: RoleEnum.Keycloak,
        },
      ].map((r) => ({
        ...r,
        granted: ((_v) => {
          throw new Error("Role granted function not implemented.");
        }) as IGranted,
      })),
      (t, r) => deepMerge(r, { granted: ((...v) => (t as Role).granted(r, ...v)) as IGranted }) as IRole
    );
  }

  // static references to objects
  Super = this.parseStrict("super");
  SuperType = this.parseStrict("super");
  Admin = this.parseStrict("admin");
  AdminType = this.parseStrict("admin");
  User = this.parseStrict("user");
  UserType = this.parseStrict("user");
  Keycloak = this.parseStrict("keycloak");
  KeycloakType = this.parseStrict("keycloak");

  /**
   * Determines if the a role is granted by the b role(s).
   * I.e. Is the role lead granted to roles user and status?
   * Written as: `role.granted("lead", "user", "status") === false`
   */
  granted = (a: IRole | number | string, ...b: (IRole | number | string)[]): boolean => {
    const name = this.parse(a)?.name;
    const roles = b.map((v) => this.parse(v)?.name).filter((v) => v);
    const granted = this.values.filter((v) => v.name === name || v.grants.includes(name ?? "")).map((v) => v.name);
    return roles.some(r => granted.includes(r as string));
  };
}

const role = new Role();

export default role;
