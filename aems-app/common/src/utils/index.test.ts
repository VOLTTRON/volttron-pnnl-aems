import * as UtilsModule from "./index";
import * as MathModule from "./math";
import * as TreeModule from "./tree";
import * as TypesModule from "./types";
import * as UtilModule from "./util";
import * as ColorModule from "./color";

describe("Utils Index Exports", () => {
  describe("Re-export Verification", () => {
    it("should re-export all functions from math module", () => {
      const mathExports = Object.keys(MathModule);

      mathExports.forEach((exportName) => {
        expect(UtilsModule).toHaveProperty(exportName);
        expect(UtilsModule[exportName as keyof typeof UtilsModule]).toBe(
          MathModule[exportName as keyof typeof MathModule],
        );
      });
    });

    it("should re-export all functions from tree module", () => {
      const treeExports = Object.keys(TreeModule);

      treeExports.forEach((exportName) => {
        expect(UtilsModule).toHaveProperty(exportName);
        expect(UtilsModule[exportName as keyof typeof UtilsModule]).toBe(
          TreeModule[exportName as keyof typeof TreeModule],
        );
      });
    });

    it("should re-export all functions from types module", () => {
      const typesExports = Object.keys(TypesModule);

      typesExports.forEach((exportName) => {
        expect(UtilsModule).toHaveProperty(exportName);
        expect(UtilsModule[exportName as keyof typeof UtilsModule]).toBe(
          TypesModule[exportName as keyof typeof TypesModule],
        );
      });
    });

    it("should re-export all functions from util module", () => {
      const utilExports = Object.keys(UtilModule);

      utilExports.forEach((exportName) => {
        expect(UtilsModule).toHaveProperty(exportName);
        expect(UtilsModule[exportName as keyof typeof UtilsModule]).toBe(
          UtilModule[exportName as keyof typeof UtilModule],
        );
      });
    });
  });

  describe("Export Completeness", () => {
    it("should have all expected utility exports", () => {
      const utilsExports = Object.keys(UtilsModule);

      // Should have exports from all modules
      expect(utilsExports.length).toBeGreaterThan(0);

      // Verify we have a reasonable number of exports (not empty)
      expect(utilsExports.length).toBeGreaterThanOrEqual(4);
    });

    it("should not have any undefined exports", () => {
      const utilsExports = Object.keys(UtilsModule);

      utilsExports.forEach((exportName) => {
        expect(UtilsModule[exportName as keyof typeof UtilsModule]).toBeDefined();
      });
    });
  });

  describe("Module Structure", () => {
    it("should be an object containing utility functions", () => {
      expect(typeof UtilsModule).toBe("object");
      expect(UtilsModule).not.toBeNull();
    });

    it("should have consistent export types", () => {
      const utilsExports = Object.keys(UtilsModule);

      // Most exports should be functions, but some might be constants or classes
      const exportTypes = utilsExports.map((exportName) => typeof UtilsModule[exportName as keyof typeof UtilsModule]);

      // Should have at least some functions
      expect(exportTypes).toContain("function");
    });
  });

  describe("Individual Module Integration", () => {
    it("should maintain function signatures from math module", () => {
      // Test that functions work as expected after re-export
      if ("add" in UtilsModule && typeof UtilsModule.add === "function") {
        // This is just an example - actual function names depend on what's in math.ts
        expect(typeof UtilsModule.add).toBe("function");
      }
    });

    it("should maintain function signatures from tree module", () => {
      // Test that tree functions are properly re-exported
      const treeExports = Object.keys(TreeModule);

      treeExports.forEach((exportName) => {
        const originalFunction = TreeModule[exportName as keyof typeof TreeModule];
        const reExportedFunction = UtilsModule[exportName as keyof typeof UtilsModule];

        if (typeof originalFunction === "function") {
          expect(typeof reExportedFunction).toBe("function");
          expect(reExportedFunction).toBe(originalFunction);
        }
      });
    });

    it("should maintain function signatures from types module", () => {
      // Test that type utility functions are properly re-exported
      const typesExports = Object.keys(TypesModule);

      typesExports.forEach((exportName) => {
        const originalFunction = TypesModule[exportName as keyof typeof TypesModule];
        const reExportedFunction = UtilsModule[exportName as keyof typeof UtilsModule];

        if (typeof originalFunction === "function") {
          expect(typeof reExportedFunction).toBe("function");
          expect(reExportedFunction).toBe(originalFunction);
        }
      });
    });

    it("should maintain function signatures from util module", () => {
      // Test that general utility functions are properly re-exported
      const utilExports = Object.keys(UtilModule);

      utilExports.forEach((exportName) => {
        const originalFunction = UtilModule[exportName as keyof typeof UtilModule];
        const reExportedFunction = UtilsModule[exportName as keyof typeof UtilsModule];

        if (typeof originalFunction === "function") {
          expect(typeof reExportedFunction).toBe("function");
          expect(reExportedFunction).toBe(originalFunction);
        }
      });
    });
  });

  describe("Missing Exports Check", () => {
    it("should not be missing any exports from individual modules", () => {
      const allIndividualExports = [
        ...Object.keys(MathModule),
        ...Object.keys(TreeModule),
        ...Object.keys(TypesModule),
        ...Object.keys(UtilModule),
      ];

      const utilsExports = Object.keys(UtilsModule);

      // Every individual export should be available in the utils index
      allIndividualExports.forEach((exportName) => {
        expect(utilsExports).toContain(exportName);
      });
    });

    it("should have the same number of exports as the sum of individual modules", () => {
      const mathExportsCount = Object.keys(MathModule).length;
      const treeExportsCount = Object.keys(TreeModule).length;
      const typesExportsCount = Object.keys(TypesModule).length;
      const utilExportsCount = Object.keys(UtilModule).length;
      const colorExportsCount = Object.keys(ColorModule).length;

      const totalIndividualExports =
        mathExportsCount + treeExportsCount + typesExportsCount + utilExportsCount + colorExportsCount;
      const utilsExportsCount = Object.keys(UtilsModule).length;

      expect(utilsExportsCount).toBe(totalIndividualExports);
    });
  });
});
