import palettesData from "./palettes.json";
import { Palette, Color, PaletteType, PaletteScheme } from "./palette";
import { typeofHex } from "@local/common";

describe("Palettes JSON Validation", () => {
  it("should have valid JSON structure", () => {
    expect(palettesData).toBeDefined();
    expect(palettesData.palettes).toBeDefined();
    expect(Array.isArray(palettesData.palettes)).toBe(true);
  });

  it("should contain expected number of custom palettes", () => {
    expect(palettesData.palettes.length).toBe(8);
  });

  it("should have all required palette properties", () => {
    palettesData.palettes.forEach((palette, index) => {
      expect(palette).toHaveProperty("name");
      expect(palette).toHaveProperty("type");
      expect(palette).toHaveProperty("scheme");
      expect(palette).toHaveProperty("colors");

      expect(typeof palette.name).toBe("string");
      expect(typeof palette.type).toBe("string");
      expect(typeof palette.scheme).toBe("string");
      expect(Array.isArray(palette.colors)).toBe(true);

      // Check that name is not empty
      expect(palette.name.trim()).not.toBe("");

      // Check that colors array is not empty
      expect(palette.colors.length).toBeGreaterThan(0);
    });
  });

  it("should have valid color objects", () => {
    palettesData.palettes.forEach((palette) => {
      palette.colors.forEach((color, colorIndex) => {
        expect(color).toHaveProperty("name");
        expect(color).toHaveProperty("hex");

        expect(typeof color.name).toBe("string");
        expect(typeof color.hex).toBe("string");

        // Check that color name is not empty
        expect(color.name.trim()).not.toBe("");

        // Check that hex is valid format
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{8}$/);
      });
    });
  });

  it("should have valid palette types", () => {
    const validTypes = Object.values(PaletteType);
    palettesData.palettes.forEach((palette) => {
      expect(validTypes).toContain(palette.type);
    });
  });

  it("should have valid palette schemes", () => {
    const validSchemes = [...Object.values(PaletteScheme), "Analogous", "Triadic"];
    palettesData.palettes.forEach((palette) => {
      expect(validSchemes).toContain(palette.scheme);
    });
  });

  it("should have unique palette names", () => {
    const names = palettesData.palettes.map((p) => p.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it("should be able to create Palette objects from JSON data", () => {
    const throwError = (hex: string) => {
      throw new Error(`Invalid hex color: ${hex}`);
    };
    palettesData.palettes.forEach((paletteData) => {
      expect(() => {
        const colors = paletteData.colors.map((colorData) =>
          typeofHex(colorData.hex)
            ? Color.build(colorData as { name: string; hex: `#${string}` })
            : throwError(colorData.hex),
        );
        const palette = new Palette(paletteData.name, paletteData.type, paletteData.scheme, ...colors);

        expect(palette.name).toBe(paletteData.name);
        expect(palette.type).toBe(paletteData.type);
        expect(palette.scheme).toBe(paletteData.scheme);
        expect(palette.colors.length).toBe(paletteData.colors.length);
      }).not.toThrow();
    });
  });

  it("should have valid color hex values that can be parsed", () => {
    const throwError = (hex: string) => {
      throw new Error(`Invalid hex color: ${hex}`);
    };
    palettesData.palettes.forEach((palette) => {
      palette.colors.forEach((colorData) => {
        expect(() => {
          const color = typeofHex(colorData.hex)
            ? Color.build(colorData as { name: string; hex: `#${string}` })
            : throwError(colorData.hex);
          expect(color.hex).toBe(colorData.hex.toLowerCase());
          expect(color.name).toBe(colorData.name);

          // Test that color properties are accessible
          expect(typeof color.red).toBe("number");
          expect(typeof color.green).toBe("number");
          expect(typeof color.blue).toBe("number");
          expect(typeof color.alpha).toBe("number");

          expect(color.red).toBeGreaterThanOrEqual(0);
          expect(color.red).toBeLessThanOrEqual(255);
          expect(color.green).toBeGreaterThanOrEqual(0);
          expect(color.green).toBeLessThanOrEqual(255);
          expect(color.blue).toBeGreaterThanOrEqual(0);
          expect(color.blue).toBeLessThanOrEqual(255);
          expect(color.alpha).toBeGreaterThanOrEqual(0);
          expect(color.alpha).toBeLessThanOrEqual(1);
        }).not.toThrow();
      });
    });
  });

  it("should have consistent color count per palette", () => {
    palettesData.palettes.forEach((palette) => {
      expect(palette.colors.length).toBeGreaterThanOrEqual(3);
      expect(palette.colors.length).toBeLessThanOrEqual(10);
    });
  });

  describe("Individual Palette Validation", () => {
    it("should validate Radiant Harmony palette", () => {
      const palette = palettesData.palettes.find((p) => p.name === "Radiant Harmony");
      expect(palette).toBeDefined();
      expect(palette!.type).toBe("Custom");
      expect(palette!.scheme).toBe("Diverging");
      expect(palette!.colors.length).toBe(5);
    });

    it("should validate Desert Oasis palette", () => {
      const palette = palettesData.palettes.find((p) => p.name === "Desert Oasis");
      expect(palette).toBeDefined();
      expect(palette!.type).toBe("Custom");
      expect(palette!.scheme).toBe("Diverging");
      expect(palette!.colors.length).toBe(5);
    });

    it("should validate Coastal Sunrise palette", () => {
      const palette = palettesData.palettes.find((p) => p.name === "Coastal Sunrise");
      expect(palette).toBeDefined();
      expect(palette!.type).toBe("Custom");
      expect(palette!.scheme).toBe("Qualitative");
      expect(palette!.colors.length).toBe(5);
    });

    it("should validate Tropical Paradise palette", () => {
      const palette = palettesData.palettes.find((p) => p.name === "Tropical Paradise");
      expect(palette).toBeDefined();
      expect(palette!.type).toBe("Custom");
      expect(palette!.scheme).toBe("Qualitative");
      expect(palette!.colors.length).toBe(5);
    });

    it("should validate Vibrant Energy palette", () => {
      const palette = palettesData.palettes.find((p) => p.name === "Vibrant Energy");
      expect(palette).toBeDefined();
      expect(palette!.type).toBe("Custom");
      expect(palette!.scheme).toBe("Triadic");
      expect(palette!.colors.length).toBe(5);
    });
  });

  describe("Color Format Validation", () => {
    it("should have all colors with alpha channel", () => {
      palettesData.palettes.forEach((palette) => {
        palette.colors.forEach((color) => {
          expect(color.hex).toMatch(/^#[0-9A-Fa-f]{8}$/);
          expect(color.hex.endsWith("ff")).toBe(true); // All colors should be fully opaque
        });
      });
    });

    it("should have valid color names without special characters", () => {
      palettesData.palettes.forEach((palette) => {
        palette.colors.forEach((color) => {
          // Color names should only contain letters, numbers, hyphens, and spaces
          expect(color.name).toMatch(/^[A-Za-z0-9\s\-]+$/);
          expect(color.name.trim()).toBe(color.name); // No leading/trailing whitespace
        });
      });
    });
  });

  describe("Schema Compliance", () => {
    it("should match expected JSON schema structure", () => {
      expect(palettesData).toEqual(
        expect.objectContaining({
          $schema: "palettes.schema.json",
          palettes: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              type: expect.any(String),
              scheme: expect.any(String),
              colors: expect.arrayContaining([
                expect.objectContaining({
                  name: expect.any(String),
                  hex: expect.any(String),
                }),
              ]),
            }),
          ]),
        }),
      );
    });
  });
});
