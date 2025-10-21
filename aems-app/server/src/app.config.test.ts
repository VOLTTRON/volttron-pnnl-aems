import { AppConfigService } from "./app.config";
import { RoleType } from "@local/common";
import { Logger } from "@nestjs/common";

describe("AppConfigService", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear all environment variables
    Object.keys(process.env).forEach(key => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("constructor", () => {
    it("should use default values when environment variables are not set", () => {
      const config = new AppConfigService();

      expect(config.nodeEnv).toBe("development");
      expect(config.port).toBe(3000);
      expect(config.project.name).toBe("");
      expect(config.log.transports).toEqual([]);
      expect(config.session.maxAge).toBe(86400000);
      expect(config.redis.port).toBe(6379);
      expect(config.database.port).toBe(5432);
      expect(config.jwt.expiresIn).toBe(86400);
      expect(config.password.strength).toBe(0);
    });

    it("should parse environment variables correctly", () => {
      process.env.NODE_ENV = "production";
      process.env.PORT = "8080";
      process.env.PROJECT_NAME = "Test Project";
      process.env.LOG_TRANSPORTS = "console,database,file";
      process.env.SESSION_MAX_AGE = "3600000";
      process.env.REDIS_PORT = "6380";
      process.env.DATABASE_PORT = "5433";
      process.env.JWT_EXPIRES_IN = "7200";
      process.env.PASSWORD_STRENGTH = "3";

      const config = new AppConfigService();

      expect(config.nodeEnv).toBe("production");
      expect(config.port).toBe(8080);
      expect(config.project.name).toBe("Test Project");
      expect(config.log.transports).toEqual(["console", "database", "file"]);
      expect(config.session.maxAge).toBe(3600000);
      expect(config.redis.port).toBe(6380);
      expect(config.database.port).toBe(5433);
      expect(config.jwt.expiresIn).toBe(7200);
      expect(config.password.strength).toBe(3);
    });

    it("should handle boolean parsing correctly", () => {
      process.env.GRAPHQL_EDITOR = "true";
      process.env.KEYCLOAK_PASS_ROLES = "false";
      process.env.PASSWORD_VALIDATE = "yes";
      process.env.SERVICE_LOG_PRUNE = "1";

      const config = new AppConfigService();

      expect(config.graphql.editor).toBe(true);
      expect(config.keycloak.passRoles).toBe(false);
      expect(config.password.validate).toBe(true);
      expect(config.service.log.prune).toBe(true);
    });

    it("should handle invalid numeric values gracefully", () => {
      process.env.PORT = "invalid";
      process.env.SESSION_MAX_AGE = "not-a-number";
      process.env.REDIS_PORT = "";
      process.env.DATABASE_PORT = "abc";

      const config = new AppConfigService();

      expect(config.port).toBeNaN();
      expect(config.session.maxAge).toBeNaN();
      expect(config.redis.port).toBeNaN();
      expect(config.database.port).toBeNaN();
    });

    it("should handle array parsing with empty values", () => {
      process.env.LOG_TRANSPORTS = "";
      process.env.AUTH_PROVIDERS = "local,,keycloak,";

      const config = new AppConfigService();

      expect(config.log.transports).toEqual([""]);
      expect(config.auth.providers).toEqual(["local", "", "keycloak", ""]);
    });
  });

  describe("ext configuration parsing", () => {
    it("should parse valid ext configurations", () => {
      process.env.EXT_SERVICE1_PATH = "/ext/service1";
      process.env.EXT_SERVICE1_ROLE = "admin";
      process.env.EXT_SERVICE1_AUTHORIZED = "http://localhost:8080";
      process.env.EXT_SERVICE1_UNAUTHORIZED = "/login";

      const config = new AppConfigService();

      expect(config.ext.service1).toBeDefined();
      expect(config.ext.service1.path).toBe("/ext/service1");
      expect(config.ext.service1.role).toBe(RoleType.Admin);
      expect(config.ext.service1.authorized).toBe("http://localhost:8080");
      expect(config.ext.service1.unauthorized).toBe("/login");
    });

    it("should handle multiple ext configurations", () => {
      process.env.EXT_API_PATH = "/ext/api";
      process.env.EXT_API_ROLE = "user";
      process.env.EXT_DASHBOARD_PATH = "/ext/dashboard";
      process.env.EXT_DASHBOARD_ROLE = "admin";

      const config = new AppConfigService();

      expect(config.ext.api).toBeDefined();
      expect(config.ext.api.path).toBe("/ext/api");
      expect(config.ext.api.role).toBe(RoleType.User);
      expect(config.ext.dashboard).toBeDefined();
      expect(config.ext.dashboard.path).toBe("/ext/dashboard");
      expect(config.ext.dashboard.role).toBe(RoleType.Admin);
    });

    it("should log error for invalid path", () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      
      process.env.EXT_SERVICE1_PATH = "/invalid/path";

      const config = new AppConfigService();

      expect(config.ext.service1?.path).toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('External service configuration \'EXT_SERVICE1_PATH\' path must start with "/ext/"')
      );

      loggerErrorSpy.mockRestore();
    });

    it("should log error for invalid role", () => {
      const loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      
      process.env.EXT_SERVICE1_ROLE = "invalid-role";

      const config = new AppConfigService();

      expect(config.ext.service1?.role).toBeUndefined();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('External service configuration \'EXT_SERVICE1_ROLE\' role is invalid')
      );

      loggerErrorSpy.mockRestore();
    });

    it("should handle case-insensitive ext configuration keys", () => {
      process.env.EXT_MY_SERVICE_PATH = "/ext/my-service";
      process.env.EXT_MY_SERVICE_ROLE = "user";

      const config = new AppConfigService();

      expect(config.ext["my_service"]).toBeDefined();
      expect(config.ext["my_service"].path).toBe("/ext/my-service");
      expect(config.ext["my_service"].role).toBe(RoleType.User);
    });

    it("should ignore non-ext environment variables", () => {
      process.env.SOME_OTHER_PATH = "/ext/other";
      process.env.EXT_INVALID = "value";
      process.env.EXT_SERVICE_INVALID_OPTION = "value";

      const config = new AppConfigService();

      expect(Object.keys(config.ext)).toHaveLength(0);
    });

    it("should handle empty ext values", () => {
      process.env.EXT_SERVICE1_PATH = "";
      process.env.EXT_SERVICE1_ROLE = "";
      process.env.EXT_SERVICE1_AUTHORIZED = "";
      process.env.EXT_SERVICE1_UNAUTHORIZED = "";

      const config = new AppConfigService();

      expect(config.ext.service1?.authorized).toBe("");
      expect(config.ext.service1?.unauthorized).toBe("");
      expect(config.ext.service1?.path).toBeUndefined();
      expect(config.ext.service1?.role).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined environment variables", () => {
      // Explicitly set some env vars to undefined
      process.env.LOG_TRANSPORTS = undefined;
      process.env.AUTH_PROVIDERS = undefined;

      const config = new AppConfigService();

      expect(config.log.transports).toEqual([]);
      expect(config.auth.providers).toEqual([]);
    });

    it("should handle special characters in configuration", () => {
      process.env.PROJECT_NAME = "Test Project with Special Chars: !@#$%^&*()";
      process.env.SESSION_SECRET = "secret-with-special-chars-123!@#";

      const config = new AppConfigService();

      expect(config.project.name).toBe("Test Project with Special Chars: !@#$%^&*()");
      expect(config.session.secret).toBe("secret-with-special-chars-123!@#");
    });

    it("should handle very large numbers", () => {
      process.env.SESSION_MAX_AGE = "999999999999";
      process.env.JWT_EXPIRES_IN = "2147483647";

      const config = new AppConfigService();

      expect(config.session.maxAge).toBe(999999999999);
      expect(config.jwt.expiresIn).toBe(2147483647);
    });

    it("should handle negative numbers", () => {
      process.env.PORT = "-1";
      process.env.PASSWORD_STRENGTH = "-5";

      const config = new AppConfigService();

      expect(config.port).toBe(-1);
      expect(config.password.strength).toBe(-5);
    });
  });

  describe("static properties", () => {
    it("should have correct static Key property", () => {
      expect(AppConfigService.Key).toBe("CONFIGURATION(AppConfigService)");
    });
  });
});
