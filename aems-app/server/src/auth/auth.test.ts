/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { AuthUser, buildExpressUser, checkPassword, AuthRoles } from "./index";
import { RoleType } from "@local/common";
import { User } from "@prisma/client";

describe("Auth Module", () => {
  describe("AuthUser", () => {
    describe("constructor with User object", () => {
      it("should create AuthUser from Prisma User", () => {
        const user: Partial<User> = {
          id: "user-1",
          role: "admin,user",
        };

        const authUser = new AuthUser(user);

        expect(authUser.id).toBe("user-1");
        expect(authUser.roles.admin).toBe(true);
        expect(authUser.roles.user).toBe(true);
        expect(authUser.roles.super).toBe(false);
      });

      it("should create AuthUser from Express User", () => {
        const user: Partial<Express.User> = {
          id: "user-2",
          authRoles: {
            admin: false,
            user: true,
            super: false,
          },
        };

        const authUser = new AuthUser(user);

        expect(authUser.id).toBe("user-2");
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(true);
        expect(authUser.roles.super).toBe(false);
      });

      it("should handle undefined user object", () => {
        const authUser = new AuthUser(undefined);

        expect(authUser.id).toBeUndefined();
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(false);
        expect(authUser.roles.super).toBe(false);
      });

      it("should handle empty user object", () => {
        const authUser = new AuthUser({});

        expect(authUser.id).toBeUndefined();
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(false);
        expect(authUser.roles.super).toBe(false);
      });
    });

    describe("constructor with id and role string", () => {
      it("should create AuthUser with id and role string", () => {
        const authUser = new AuthUser("user-3", "admin");

        expect(authUser.id).toBe("user-3");
        expect(authUser.roles.admin).toBe(true);
        expect(authUser.roles.user).toBe(true); // admin grants user
        expect(authUser.roles.super).toBe(false);
      });

      it("should handle empty role string", () => {
        const authUser = new AuthUser("user-4", "");

        expect(authUser.id).toBe("user-4");
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(false);
        expect(authUser.roles.super).toBe(false);
      });

      it("should handle undefined role string", () => {
        const authUser = new AuthUser("user-5", undefined);

        expect(authUser.id).toBe("user-5");
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(false);
        expect(authUser.roles.super).toBe(false);
      });
    });

    describe("constructor with id and AuthRoles", () => {
      it("should create AuthUser with id and AuthRoles", () => {
        const roles: AuthRoles = {
          admin: true,
          user: false,
          super: false,
        };

        const authUser = new AuthUser("user-6", roles);

        expect(authUser.id).toBe("user-6");
        expect(authUser.roles.admin).toBe(true);
        expect(authUser.roles.user).toBe(false);
        expect(authUser.roles.super).toBe(false);
      });

      it("should handle undefined AuthRoles", () => {
        const authUser = new AuthUser("user-7", undefined);

        expect(authUser.id).toBe("user-7");
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(false);
        expect(authUser.roles.super).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle complex role strings", () => {
        const authUser = new AuthUser("user-8", "admin, user, super");

        expect(authUser.id).toBe("user-8");
        expect(authUser.roles.admin).toBe(true);
        expect(authUser.roles.user).toBe(true);
        expect(authUser.roles.super).toBe(true);
      });

      it("should handle role strings with different separators", () => {
        const authUser = new AuthUser("user-9", "admin|user,super");

        expect(authUser.id).toBe("user-9");
        expect(authUser.roles.admin).toBe(true);
        expect(authUser.roles.user).toBe(true);
        expect(authUser.roles.super).toBe(true);
      });

      it("should handle invalid role names", () => {
        const authUser = new AuthUser("user-10", "invalid-role,user");

        expect(authUser.id).toBe("user-10");
        expect(authUser.roles.admin).toBe(false);
        expect(authUser.roles.user).toBe(true);
        expect(authUser.roles.super).toBe(false);
      });

      it("should handle whitespace in role strings", () => {
        const authUser = new AuthUser("user-11", "  admin  ,  user  ");

        expect(authUser.id).toBe("user-11");
        expect(authUser.roles.admin).toBe(true);
        expect(authUser.roles.user).toBe(true);
        expect(authUser.roles.super).toBe(false);
      });
    });
  });

  describe("buildExpressUser", () => {
    it("should build Express User from Prisma User", () => {
      const user: User = {
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        image: null,
        emailVerified: null,
        role: "admin,user",
        password: "hashed-password",
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expressUser = buildExpressUser(user);

      expect(expressUser.id).toBe("user-1");
      expect(expressUser.email).toBe("test@example.com");
      expect(expressUser.name).toBe("Test User");
      expect(expressUser.role).toBe("admin,user");
      expect('password' in expressUser).toBe(false); // should be omitted
      expect(expressUser.roles).toHaveLength(2);
      expect(expressUser.roles).toContain(RoleType.Admin);
      expect(expressUser.roles).toContain(RoleType.User);
      expect(expressUser.authRoles.admin).toBe(true);
      expect(expressUser.authRoles.user).toBe(true);
      expect(expressUser.authRoles.super).toBe(false);
    });

    it("should handle user without password field", () => {
      const user: Omit<User, "password"> = {
        id: "user-2",
        email: "test2@example.com",
        name: "Test User 2",
        image: null,
        emailVerified: null,
        role: "user",
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expressUser = buildExpressUser(user);

      expect(expressUser.id).toBe("user-2");
      expect(expressUser.email).toBe("test2@example.com");
      expect(expressUser.roles).toHaveLength(1);
      expect(expressUser.roles).toContain(RoleType.User);
      expect(expressUser.authRoles.admin).toBe(false);
      expect(expressUser.authRoles.user).toBe(true);
    });

    it("should handle user with no roles", () => {
      const user: User = {
        id: "user-3",
        email: "test3@example.com",
        name: "Test User 3",
        image: null,
        emailVerified: null,
        role: null,
        password: "hashed-password",
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expressUser = buildExpressUser(user);

      expect(expressUser.id).toBe("user-3");
      expect(expressUser.roles).toHaveLength(0);
      expect(expressUser.authRoles.admin).toBe(false);
      expect(expressUser.authRoles.user).toBe(false);
      expect(expressUser.authRoles.super).toBe(false);
    });

    it("should handle user with empty role string", () => {
      const user: User = {
        id: "user-4",
        email: "test4@example.com",
        name: "Test User 4",
        image: null,
        emailVerified: null,
        role: "",
        password: "hashed-password",
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expressUser = buildExpressUser(user);

      expect(expressUser.id).toBe("user-4");
      expect(expressUser.roles).toHaveLength(0);
      expect(expressUser.authRoles.admin).toBe(false);
      expect(expressUser.authRoles.user).toBe(false);
      expect(expressUser.authRoles.super).toBe(false);
    });

    it("should handle invalid role names", () => {
      const user: User = {
        id: "user-5",
        email: "test5@example.com",
        name: "Test User 5",
        image: null,
        emailVerified: null,
        role: "invalid-role,user,another-invalid",
        password: "hashed-password",
        preferences: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expressUser = buildExpressUser(user);

      expect(expressUser.id).toBe("user-5");
      expect(expressUser.roles).toHaveLength(1);
      expect(expressUser.roles).toContain(RoleType.User);
      expect(expressUser.authRoles.user).toBe(true);
    });
  });

  describe("checkPassword", () => {
    it("should return password strength analysis", () => {
      const result = checkPassword("password123");

      expect(result).toHaveProperty("score");
      expect(result).toHaveProperty("feedback");
      expect(result).toHaveProperty("crackTimesSeconds");
      expect(result).toHaveProperty("crackTimesDisplay");
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(4);
    });

    it("should handle strong passwords", () => {
      const result = checkPassword("MyVeryStrongP@ssw0rd!2023");

      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it("should handle weak passwords", () => {
      const result = checkPassword("123");

      expect(result.score).toBeLessThanOrEqual(1);
    });

    it("should handle empty password", () => {
      const result = checkPassword("");

      expect(result.score).toBe(0);
    });

    it("should consider user inputs in analysis", () => {
      const userInputs = ["john", "doe", "johndoe@example.com"];
      const result = checkPassword("johndoe123", userInputs);

      expect(result.score).toBeLessThanOrEqual(2); // Should be weaker due to user inputs
    });

    it("should handle user inputs with numbers", () => {
      const userInputs = ["john", 1990, "company"];
      const result = checkPassword("john1990company", userInputs);

      expect(result.score).toBeLessThanOrEqual(3); // Should be weaker due to user inputs
    });

    it("should handle special characters in password", () => {
      const result = checkPassword("P@ssw0rd!#$%");

      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it("should handle very long passwords", () => {
      const longPassword = "a".repeat(100);
      const result = checkPassword(longPassword);

      expect(result).toHaveProperty("score");
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it("should handle unicode characters", () => {
      const result = checkPassword("пароль123");

      expect(result).toHaveProperty("score");
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });

  describe("edge cases and error handling", () => {
    it("should handle string-based constructor", () => {
      const authUser = new AuthUser("user-id", "admin");

      expect(authUser.id).toBe("user-id");
      expect(authUser.roles.admin).toBe(true);
      expect(authUser.roles.user).toBe(true);
      expect(authUser.roles.super).toBe(false);
    });

    it("should handle malformed user objects with string role", () => {
      const malformedUser = {
        id: 123, // number instead of string
        role: "admin", // valid string role
      };

      const authUser = new AuthUser(malformedUser as any);

      expect(authUser.id).toBe(123);
      expect(authUser.roles.admin).toBe(true);
      expect(authUser.roles.user).toBe(true);
    });

    it("should handle objects with additional properties", () => {
      const userWithExtra = {
        id: "user-1",
        role: "admin",
        extraProperty: "ignored",
      };

      expect(() => new AuthUser(userWithExtra as any)).not.toThrow();
      const authUser = new AuthUser(userWithExtra as any);
      expect(authUser.id).toBe("user-1");
      expect(authUser.roles.admin).toBe(true);
    });
  });
});
