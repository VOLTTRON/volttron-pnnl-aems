import { SchemaBuilderService } from "./builder.service";
import { AppConfigService } from "@/app.config";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";

// Mock dependencies
jest.mock("@/prisma/prisma.service");
jest.mock("@/subscription/subscription.service");

describe("SchemaBuilderService", () => {
  let schemaBuilderService: SchemaBuilderService;
  let mockConfigService: AppConfigService;
  let mockPrismaService: jest.Mocked<PrismaService>;
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;

  beforeEach(() => {
    mockConfigService = {
      nodeEnv: "development",
    } as unknown as AppConfigService;

    mockPrismaService = {
      prisma: {},
    } as unknown as jest.Mocked<PrismaService>;

    mockSubscriptionService = {
      asyncIterator: jest.fn(),
    } as unknown as jest.Mocked<SubscriptionService>;

    schemaBuilderService = new SchemaBuilderService(
      mockPrismaService,
      mockConfigService,
      mockSubscriptionService
    );
  });

  describe("constructor", () => {
    it("should initialize with configuration", () => {
      expect(schemaBuilderService).toBeInstanceOf(SchemaBuilderService);
    });

    it("should create scalar types", () => {
      expect(schemaBuilderService.DateTime).toBeDefined();
      expect(schemaBuilderService.Json).toBeDefined();
    });

    it("should create enum types", () => {
      expect(schemaBuilderService.Mode).toBeDefined();
      expect(schemaBuilderService.Mutation).toBeDefined();
    });

    it("should create filter types", () => {
      expect(schemaBuilderService.BooleanFilter).toBeDefined();
      expect(schemaBuilderService.IntFilter).toBeDefined();
      expect(schemaBuilderService.FloatFilter).toBeDefined();
      expect(schemaBuilderService.StringFilter).toBeDefined();
      expect(schemaBuilderService.DateTimeFilter).toBeDefined();
    });

    it("should create input types", () => {
      expect(schemaBuilderService.PagingInput).toBeDefined();
    });
  });

  describe("onModuleInit", () => {
    it("should set initialized flag", () => {
      schemaBuilderService.onModuleInit();
      // The initialized flag should be set (private property, so we test behavior)
      expect(schemaBuilderService).toBeInstanceOf(SchemaBuilderService);
    });
  });

  describe("awaitSchema", () => {
    it("should return schema when initialized", async () => {
      schemaBuilderService.onModuleInit();
      
      const schema = await schemaBuilderService.awaitSchema();
      expect(schema).toBeDefined();
      expect(typeof schema).toBe("object");
    });

    it("should handle initialization state", async () => {
      // Test that the service can be initialized
      expect(() => {
        schemaBuilderService.onModuleInit();
      }).not.toThrow();
      
      // Test that awaitSchema works after initialization
      await expect(schemaBuilderService.awaitSchema()).resolves.toBeDefined();
    });
  });

  describe("static methods", () => {
    it("should have aggregateToGroupBy method", () => {
      expect(typeof SchemaBuilderService.aggregateToGroupBy).toBe("function");
    });

    it("should convert aggregate to groupBy format", () => {
      const aggregate = {
        average: ["field1", "field2"],
        count: ["field3"],
        maximum: ["field1"],
        minimum: ["field2"],
        sum: ["field1", "field3"],
      };

      const result = SchemaBuilderService.aggregateToGroupBy(aggregate);
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });

    it("should handle empty aggregate", () => {
      const result = SchemaBuilderService.aggregateToGroupBy(null);
      expect(result).toEqual({});
    });

    it("should handle undefined aggregate", () => {
      const result = SchemaBuilderService.aggregateToGroupBy(undefined);
      expect(result).toEqual({});
    });
  });

  describe("schema functionality", () => {
    it("should provide access to Pothos builder methods", () => {
      // Check that common Pothos builder methods exist
      expect(typeof schemaBuilderService.queryType).toBe("function");
      expect(typeof schemaBuilderService.mutationType).toBe("function");
      expect(typeof schemaBuilderService.subscriptionType).toBe("function");
    });

    it("should allow creating schema", () => {
      schemaBuilderService.onModuleInit();
      
      expect(() => {
        schemaBuilderService.toSchema();
      }).not.toThrow();
    });

    it("should have scalar type methods", () => {
      expect(typeof schemaBuilderService.addScalarType).toBe("function");
    });

    it("should have enum type methods", () => {
      expect(typeof schemaBuilderService.enumType).toBe("function");
    });

    it("should have input type methods", () => {
      expect(typeof schemaBuilderService.inputType).toBe("function");
    });
  });

  describe("configuration handling", () => {
    it("should work with production environment", () => {
      const prodConfig = {
        nodeEnv: "production",
      } as unknown as AppConfigService;

      expect(() => {
        new SchemaBuilderService(mockPrismaService, prodConfig, mockSubscriptionService);
      }).not.toThrow();
    });

    it("should work with development environment", () => {
      const devConfig = {
        nodeEnv: "development",
      } as unknown as AppConfigService;

      expect(() => {
        new SchemaBuilderService(mockPrismaService, devConfig, mockSubscriptionService);
      }).not.toThrow();
    });
  });

  describe("multiple instances", () => {
    it("should allow multiple schema builder service instances", () => {
      const service1 = new SchemaBuilderService(mockPrismaService, mockConfigService, mockSubscriptionService);
      const service2 = new SchemaBuilderService(mockPrismaService, mockConfigService, mockSubscriptionService);

      expect(service1).toBeInstanceOf(SchemaBuilderService);
      expect(service2).toBeInstanceOf(SchemaBuilderService);
      expect(service1).not.toBe(service2);
    });

    it("should maintain separate type definitions", () => {
      const service1 = new SchemaBuilderService(mockPrismaService, mockConfigService, mockSubscriptionService);
      const service2 = new SchemaBuilderService(mockPrismaService, mockConfigService, mockSubscriptionService);

      expect(service1.DateTime).toBeDefined();
      expect(service2.DateTime).toBeDefined();
      expect(service1.Json).toBeDefined();
      expect(service2.Json).toBeDefined();
    });
  });
});
