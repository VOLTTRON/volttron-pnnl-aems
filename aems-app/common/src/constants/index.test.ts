import {
  IMatcher,
  IConstant,
  IParse,
  IParseStrict,
  IBase,
  IFrequency,
  IEnum,
  ILog,
  IFeedbackStatus,
  IAllowed,
  IProcess,
  INormalization,
  IGranted,
  RoleEnum,
  IRole,
  HttpStatusEnum,
  IHttpStatus,
} from "./index";

describe("Constants Index Types and Interfaces", () => {
  describe("Basic Interfaces", () => {
    it("should define IMatcher type correctly", () => {
      const matcher: IMatcher = (value: string) => value.toUpperCase();
      expect(typeof matcher).toBe("function");
      expect(matcher("test")).toBe("TEST");
    });

    it("should define IConstant interface correctly", () => {
      const constant: IConstant = {
        name: "test",
        label: "Test Label",
        title: "Test Title",
        description: "Test Description",
      };
      
      expect(constant.name).toBe("test");
      expect(constant.label).toBe("Test Label");
      expect(constant.title).toBe("Test Title");
      expect(constant.description).toBe("Test Description");
    });

    it("should allow optional properties in IConstant", () => {
      const minimalConstant: IConstant = {
        name: "minimal",
        label: "Minimal Label",
      };
      
      expect(minimalConstant.name).toBe("minimal");
      expect(minimalConstant.label).toBe("Minimal Label");
      expect(minimalConstant.title).toBeUndefined();
      expect(minimalConstant.description).toBeUndefined();
    });
  });

  describe("Parser Types", () => {
    it("should define IParse type correctly", () => {
      const mockConstant: IConstant = { name: "test", label: "Test" };
      const parser: IParse<IConstant> = (value) => {
        if (typeof value === "string" && value === "test") return mockConstant;
        return undefined;
      };
      
      expect(parser("test")).toEqual(mockConstant);
      expect(parser("invalid")).toBeUndefined();
    });

    it("should define IParseStrict type correctly", () => {
      const mockConstant: IConstant = { name: "test", label: "Test" };
      const strictParser: IParseStrict<IConstant> = (value) => {
        if (typeof value === "string" && value === "test") return mockConstant;
        throw new Error("Invalid value");
      };
      
      expect(strictParser("test")).toEqual(mockConstant);
      expect(() => strictParser("invalid")).toThrow("Invalid value");
    });

    it("should define IBase interface correctly", () => {
      const mockConstant: IConstant = { name: "test", label: "Test" };
      const base: IBase<IConstant> = {
        parse: (value) => value === "test" ? mockConstant : undefined,
        parseStrict: (value) => {
          if (value === "test") return mockConstant;
          throw new Error("Invalid");
        },
      };
      
      expect(base.parse("test")).toEqual(mockConstant);
      expect(base.parse("invalid")).toBeUndefined();
      expect(base.parseStrict("test")).toEqual(mockConstant);
      expect(() => base.parseStrict("invalid")).toThrow();
    });
  });

  describe("Specialized Interfaces", () => {
    it("should define IFrequency interface correctly", () => {
      const frequency: IFrequency = {
        name: "daily",
        label: "Daily",
        abbr: "D",
        plural: "days",
        pattern: {
          postgres: "1 day",
          mysql: "INTERVAL 1 DAY",
        },
      };
      
      expect(frequency.name).toBe("daily");
      expect(frequency.abbr).toBe("D");
      expect(frequency.plural).toBe("days");
      expect(frequency.pattern.postgres).toBe("1 day");
      expect(frequency.pattern.mysql).toBe("INTERVAL 1 DAY");
    });

    it("should define IEnum interface correctly", () => {
      enum TestEnum {
        VALUE1 = "value1",
        VALUE2 = "value2",
      }
      
      const enumConstant: IEnum<TestEnum> = {
        name: "test",
        label: "Test",
        enum: TestEnum.VALUE1,
      };
      
      expect(enumConstant.enum).toBe(TestEnum.VALUE1);
    });

    it("should define ILog interface correctly", () => {
      // Using any to avoid Prisma type conflicts in tests
      const log: ILog = {
        name: "info",
        label: "Information",
        enum: "INFO" as never, // Using never to satisfy the interface without type conflicts
        level: "info",
      };
      
      expect(log.level).toBe("info");
      expect(log.enum).toBe("INFO");
    });
  });

  describe("Normalization Types", () => {
    it("should define IAllowed type correctly", () => {
      const allowed: IAllowed<string> = (...types) => {
        return types.includes("allowed");
      };
      
      expect(allowed("allowed")).toBe(true);
      expect(allowed("not-allowed")).toBe(false);
      expect(allowed("allowed", "not-allowed")).toBe(true);
    });

    it("should define IProcess type correctly", () => {
      const process: IProcess = (value: string) => value.trim().toLowerCase();
      
      expect(process("  TEST  ")).toBe("test");
      expect(process("Hello World")).toBe("hello world");
    });

    it("should define INormalization interface correctly", () => {
      const normalization: INormalization = {
        name: "lowercase",
        label: "Lowercase",
        unallowed: ["UPPER", "Mixed"],
        allowed: (...types) => !types.some(t => typeof t === "string" && /[A-Z]/.test(t.toString())),
        process: (value) => value.toLowerCase(),
      };
      
      expect(normalization.unallowed).toContain("UPPER");
      expect(normalization.allowed("lower")).toBe(true);
      expect(normalization.allowed("UPPER")).toBe(false);
      expect(normalization.process("TEST")).toBe("test");
    });
  });

  describe("Role Types", () => {
    it("should define RoleEnum correctly", () => {
      expect(RoleEnum.Super).toBe("super");
      expect(RoleEnum.Admin).toBe("admin");
      expect(RoleEnum.User).toBe("user");
      
      // Test that all expected values exist
      const expectedValues = ["super", "admin", "user"];
      const actualValues = Object.values(RoleEnum);
      expectedValues.forEach(value => {
        expect(actualValues).toContain(value);
      });
    });

    it("should define IGranted type correctly", () => {
      const granted: IGranted = (...values) => {
        return values.some(v => v === "admin" || v === "super");
      };
      
      expect(granted("admin")).toBe(true);
      expect(granted("user")).toBe(false);
      expect(granted("user", "admin")).toBe(true);
    });

    it("should define IRole interface correctly", () => {
      const role: IRole = {
        name: "admin",
        label: "Administrator",
        enum: RoleEnum.Admin,
        grants: ["user", "moderator"],
        granted: (...values) => values.includes("admin"),
      };
      
      expect(role.enum).toBe(RoleEnum.Admin);
      expect(role.grants).toContain("user");
      expect(role.granted("admin")).toBe(true);
      expect(role.granted("user")).toBe(false);
    });
  });

  describe("HTTP Status Types", () => {
    it("should define HttpStatusEnum correctly", () => {
      expect(HttpStatusEnum.Information).toBe("information");
      expect(HttpStatusEnum.Success).toBe("success");
      expect(HttpStatusEnum.Redirect).toBe("redirect");
      expect(HttpStatusEnum.ClientError).toBe("client-error");
      expect(HttpStatusEnum.ServerError).toBe("server-error");
      
      // Test that all expected values exist
      const expectedValues = ["information", "success", "redirect", "client-error", "server-error"];
      const actualValues = Object.values(HttpStatusEnum);
      expectedValues.forEach(value => {
        expect(actualValues).toContain(value);
      });
    });

    it("should define IHttpStatus interface correctly", () => {
      const httpStatus: IHttpStatus = {
        name: "ok",
        label: "OK",
        enum: HttpStatusEnum.Success,
        status: 200,
        statusText: "OK",
        message: "Request successful",
      };
      
      expect(httpStatus.enum).toBe(HttpStatusEnum.Success);
      expect(httpStatus.status).toBe(200);
      expect(httpStatus.statusText).toBe("OK");
      expect(httpStatus.message).toBe("Request successful");
    });
  });

  describe("Type Compatibility", () => {
    it("should allow IFeedbackStatus to extend IEnum", () => {
      // Using never to avoid Prisma type conflicts in tests
      const feedbackStatus: IFeedbackStatus = {
        name: "pending",
        label: "Pending",
        enum: "PENDING" as never, // Using never to satisfy the interface without type conflicts
      };
      
      expect(feedbackStatus.enum).toBe("PENDING");
      expect(feedbackStatus.name).toBe("pending");
      expect(feedbackStatus.label).toBe("Pending");
    });
  });
});
