import { pick } from "lodash";
import authRoles from "./authRoles";
import { RoleType } from "@/common";

describe("authRoles", () => {
  it("should return an object with granted roles when authentication is enabled", () => {
    const role = "admin, user";
    const expected = {
      [RoleType.Admin.name]: true,
      [RoleType.User.name]: true,
    };
    expect(pick(authRoles(role), [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });

  it("should return an object with all roles granted when authentication is disabled", () => {
    const role = "admin, user";
    const expected = {
      [RoleType.Admin.name]: true,
      [RoleType.User.name]: true,
    };
    expect(pick(authRoles(role), [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });

  it("should return an object with no roles granted when authentication is enabled and no roles are provided", () => {
    const role = "";
    const expected = {
      [RoleType.Admin.name]: false,
      [RoleType.User.name]: false,
    };
    expect(pick(authRoles(role), [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });

  it("should return an object with only granted roles when authentication is enabled and some roles are provided", () => {
    const role = "user";
    const expected = {
      [RoleType.Admin.name]: false,
      [RoleType.User.name]: true,
    };
    expect(pick(authRoles(role), [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });
});
