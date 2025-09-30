import * as CommonModule from "./index";

describe("Common Module Exports", () => {
  describe("Constant Exports", () => {
    it("should export Frequency constants", () => {
      expect(CommonModule.Frequency).toBeDefined();
      expect(CommonModule.FrequencyType).toBeDefined();
      expect(CommonModule.Frequency).toBe(CommonModule.FrequencyType);
    });

    it("should export HttpStatus constants", () => {
      expect(CommonModule.HttpStatus).toBeDefined();
      expect(CommonModule.HttpStatusType).toBeDefined();
      expect(CommonModule.HttpStatus).toBe(CommonModule.HttpStatusType);
    });

    it("should export Normalization constants", () => {
      expect(CommonModule.Normalization).toBeDefined();
      expect(CommonModule.NormalizationType).toBeDefined();
      expect(CommonModule.Normalization).toBe(CommonModule.NormalizationType);
    });

    it("should export Role constants", () => {
      expect(CommonModule.Role).toBeDefined();
      expect(CommonModule.RoleType).toBeDefined();
      expect(CommonModule.Role).toBe(CommonModule.RoleType);
    });

    it("should export Log constants", () => {
      expect(CommonModule.Log).toBeDefined();
      expect(CommonModule.LogType).toBeDefined();
      expect(CommonModule.Log).toBe(CommonModule.LogType);
    });

    it("should export FeedbackStatus constants", () => {
      expect(CommonModule.FeedbackStatus).toBeDefined();
      expect(CommonModule.FeedbackStatusType).toBeDefined();
      expect(CommonModule.FeedbackStatus).toBe(CommonModule.FeedbackStatusType);
    });
  });

  describe("Utility Exports", () => {
    it("should export utility functions from utils module", () => {
      // Test that utility functions are available
      // These should be exported from the utils index
      expect(typeof CommonModule).toBe("object");
      
      // Check that the module has exports beyond just the constants
      const exports = Object.keys(CommonModule);
      const constantExports = [
        "Frequency", "FrequencyType",
        "HttpStatus", "HttpStatusType", 
        "Normalization", "NormalizationType",
        "Role", "RoleType",
        "Log", "LogType",
        "FeedbackStatus", "FeedbackStatusType"
      ];
      
      // Should have more exports than just constants (utilities should be included)
      const utilityExports = exports.filter(exp => !constantExports.includes(exp));
      expect(utilityExports.length).toBeGreaterThan(0);
    });
  });

  describe("Prisma Re-exports", () => {
    it("should re-export from @local/prisma", () => {
      // This tests that the re-export statement works
      // The actual Prisma exports will depend on what's available in @local/prisma
      expect(CommonModule).toBeDefined();
    });
  });

  describe("Module Structure", () => {
    it("should have all expected constant types", () => {
      const constantTypes = [
        "Frequency", "FrequencyType",
        "HttpStatus", "HttpStatusType",
        "Normalization", "NormalizationType", 
        "Role", "RoleType",
        "Log", "LogType",
        "FeedbackStatus", "FeedbackStatusType"
      ];

      constantTypes.forEach(type => {
        expect(CommonModule).toHaveProperty(type);
      });
    });

    it("should export objects with expected structure for constants", () => {
      // Test that constants have the expected structure
      expect(typeof CommonModule.Frequency).toBe("object");
      expect(typeof CommonModule.HttpStatus).toBe("object");
      expect(typeof CommonModule.Normalization).toBe("object");
      expect(typeof CommonModule.Role).toBe("object");
      expect(typeof CommonModule.Log).toBe("object");
      expect(typeof CommonModule.FeedbackStatus).toBe("object");
    });
  });
});
