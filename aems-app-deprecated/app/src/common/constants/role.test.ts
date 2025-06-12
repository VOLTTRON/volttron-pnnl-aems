import { RoleType } from "../";
import { RoleEnum } from "../types";

describe("constants.RoleType", () => {
  describe("RoleType.matcher", () => {
    it("getter should not be null", () => {
      expect(RoleType.matcher).toBeTruthy();
    });
  });

  describe("RoleType.constants", () => {
    it("constants should not be null", () => {
      expect(RoleType.constants).toBeTruthy();
    });
  });

  describe("RoleType.parse", () => {
    it("parse should not be null", () => {
      expect(RoleType.parse(RoleEnum.Admin)).toEqual(RoleType.Admin);
    });
  });

  describe("RoleType.granted()", () => {
    it("(user, user) is true", () => {
      expect(RoleType.granted("user", "user")).toEqual(true);
    });
    it("(admin, user) is false", () => {
      expect(RoleType.granted("admin", "user")).toEqual(false);
    });
    it("(admin, admin) is true", () => {
      expect(RoleType.granted("admin", "admin")).toEqual(true);
    });
    it("(user, admin) is true", () => {
      expect(RoleType.granted("user", "admin")).toEqual(true);
    });
    it("(admin, user admin) is true", () => {
      expect(RoleType.granted("admin", "user", "admin")).toEqual(true);
    });
    it("(user, ) is false", () => {
      expect(RoleType.granted("user", "")).toEqual(false);
    });
    it("( ,user) is false", () => {
      expect(RoleType.granted("", "user")).toEqual(false);
    });
  });

  describe("RoleType.Admin.granted()", () => {
    it("(user) is false", () => {
      expect(RoleType.Admin.granted("user")).toEqual(false);
    });
    it("(admin) is true", () => {
      expect(RoleType.Admin.granted("admin")).toEqual(true);
    });
    it("(user admin) is true", () => {
      expect(RoleType.Admin.granted("user", "admin")).toEqual(true);
    });
    it("(user user) is false", () => {
      expect(RoleType.Admin.granted("user", "user")).toEqual(false);
    });
    it("() is false", () => {
      expect(RoleType.Admin.granted("")).toEqual(false);
    });
  });
});
