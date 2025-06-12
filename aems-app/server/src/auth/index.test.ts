import { pick } from "lodash";
import { AuthUser } from ".";
import { RoleType } from "@local/common";

describe("AuthUser", () => {
  it("should return an object with granted roles", () => {
    const role = "admin, user";
    const expected = {
      [RoleType.Admin.name]: true,
      [RoleType.User.name]: true,
    };
    expect(pick(new AuthUser(undefined, role).roles, [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });

  it("should return an object with no roles granted when no roles are provided", () => {
    const role = "";
    const expected = {
      [RoleType.Admin.name]: false,
      [RoleType.User.name]: false,
    };
    expect(pick(new AuthUser(undefined, role).roles, [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });

  it("should return an object with only granted roles when some roles are provided", () => {
    const role = "user";
    const expected = {
      [RoleType.Admin.name]: false,
      [RoleType.User.name]: true,
    };
    expect(pick(new AuthUser(undefined, role).roles, [RoleType.Admin.name, RoleType.User.name])).toEqual(expected);
  });
});
