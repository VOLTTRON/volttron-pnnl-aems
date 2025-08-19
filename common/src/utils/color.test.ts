import {
  colorize,
  type ColorName,
  type BrightColorName,
  type AllColorName,
  type StyleName,
  type BackgroundName,
  type AllBackgroundName,
  type ColorInput,
  type BackgroundInput,
  type RGBColor,
  Color,
  ColorType,
} from "./color";

describe("Color", () => {
  it("should create a color with hex value", () => {
    const color = new Color("#ff0000");
    expect(color.hex).toEqual("#ff0000");
  });

  it("should create a color with name and hex value", () => {
    const color = new Color("Red", "#ff0000");
    expect(color.name).toEqual("Red");
    expect(color.hex).toEqual("#ff0000");
  });

  it("should create a color with RGB values", () => {
    const color = new Color(255, 0, 0);
    expect(color.red).toEqual(255);
    expect(color.green).toEqual(0);
    expect(color.blue).toEqual(0);
  });

  it("should create a color with RGBA values", () => {
    const color = new Color(255, 0, 0, 0.5);
    expect(color.red).toEqual(255);
    expect(color.green).toEqual(0);
    expect(color.blue).toEqual(0);
    expect(color.alpha).toEqual(0.5);
  });

  it("should create a color with name and RGB values", () => {
    const color = new Color("Red", 255, 0, 0);
    expect(color.name).toEqual("Red");
    expect(color.red).toEqual(255);
    expect(color.green).toEqual(0);
    expect(color.blue).toEqual(0);
  });

  it("should create a color with name and RGBA values", () => {
    const color = new Color("Red", 255, 0, 0, 0.5);
    expect(color.name).toEqual("Red");
    expect(color.red).toEqual(255);
    expect(color.green).toEqual(0);
    expect(color.blue).toEqual(0);
    expect(color.alpha).toEqual(0.5);
  });

  it("should throw an error for invalid color values", () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    expect(() => new Color("Invalid" as any)).toThrow(new Error("Invalid color values"));
    expect(() => new Color("#GG0000")).toThrow(new Error("Invalid color values"));
  });

  it("should return the RGB value", () => {
    const color = new Color("#ff0000");
    expect(color.rgb).toEqual("rgb(255, 0, 0)");
  });

  it("should return the RGBA value", () => {
    const color = new Color("#ff0000");
    expect(color.rgba).toEqual("rgba(255, 0, 0, 1)");
  });

  it("should return the HSL value", () => {
    const color = new Color("#ff0000");
    expect(color.hsl).toEqual("hsl(0, 100%, 50%)");
  });

  it("should return the HSLA value", () => {
    const color = new Color("#ff0000");
    expect(color.hsla).toEqual("hsla(0, 100%, 50%, 1)");
  });

  it("should return the color as hex", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.Hex)).toEqual("#ff0000");
  });

  it("should return the color as hex with alpha", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.HexA)).toEqual("#ff0000ff");
  });

  it("should return the color as RGB", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.RGB)).toEqual("rgb(255, 0, 0)");
  });

  it("should return the color as RGBA", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.RGBA)).toEqual("rgba(255, 0, 0, 1)");
  });

  it("should return the color as HSL", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.HSL)).toEqual("hsl(0, 100%, 50%)");
  });

  it("should return the color as HSLA", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.HSLA)).toEqual("hsla(0, 100%, 50%, 1)");
  });

  it("should return the color as color name", () => {
    const color = new Color("#ff0000");
    expect(color.toString(ColorType.Color)).toEqual("red");
  });

  it("should return the color as hex by default", () => {
    const color = new Color("#ff0000");
    expect(color.toString()).toEqual("#ff0000");
  });

  describe("parse", () => {
    it("should parse a color in hex colorize", () => {
      const color = Color.parse("#ff0000");
      expect(color.hex).toEqual("#ff0000");
    });

    it("should parse a color in RGB colorize", () => {
      const color = Color.parse("rgb(255, 0, 0)");
      expect(color.hex).toEqual("#ff0000");
    });

    it("should parse a color in RGBA colorize", () => {
      const color = Color.parse("rgba(255, 0, 0, 0.5)");
      expect(color.hex).toEqual("#ff000080");
    });

    it("should parse a color in HSL colorize", () => {
      const color = Color.parse("hsl(0, 100%, 50%)");
      expect(color.hex).toEqual("#ff0000");
    });

    it("should parse a color in HSLA colorize", () => {
      const color = Color.parse("hsla(0, 100%, 50%, 0.5)");
      expect(color.hex).toEqual("#ff000080");
    });

    it("should throw an error for an invalid color colorize", () => {
      expect(() => Color.parse("invalid-color")).toThrow(new Error("Invalid color values"));
    });
  });
});

describe("colorize Function", () => {
  describe("Basic colorizeting", () => {
    it("should apply only color when specified", () => {
      const result = colorize("Hello", { color: "red" });
      expect(result).toBe("\x1b[31mHello\x1b[0m");
    });

    it("should apply only style when specified", () => {
      const result = colorize("Bold", { style: "bright" });
      expect(result).toBe("\x1b[1mBold\x1b[0m");
    });

    it("should apply only background when specified", () => {
      const result = colorize("Highlighted", { background: "bgYellow" });
      expect(result).toBe("\x1b[43mHighlighted\x1b[0m");
    });

    it("should return original text when no options provided", () => {
      const result = colorize("Plain Text", {});
      expect(result).toBe("Plain Text");
    });
  });

  describe("Combined colorizeting", () => {
    it("should apply color and style together", () => {
      const result = colorize("Important", { color: "red", style: "bright" });
      expect(result).toBe("\x1b[31m\x1b[1mImportant\x1b[0m");
    });

    it("should apply color and background together", () => {
      const result = colorize("Alert", { color: "white", background: "bgRed" });
      expect(result).toBe("\x1b[41m\x1b[37mAlert\x1b[0m");
    });

    it("should apply style and background together", () => {
      const result = colorize("Notice", { style: "bright", background: "bgBlue" });
      expect(result).toBe("\x1b[44m\x1b[1mNotice\x1b[0m");
    });

    it("should apply all three colorizeting options together", () => {
      const result = colorize("Critical", { color: "white", style: "bright", background: "bgRed" });
      expect(result).toBe("\x1b[41m\x1b[37m\x1b[1mCritical\x1b[0m");
    });
  });

  describe("Advanced Color Support", () => {
    it("should apply 4-bit bright colors", () => {
      const result = colorize("Bright Red", { color: "brightRed" });
      expect(result).toBe("\x1b[91mBright Red\x1b[0m");
    });

    it("should apply RGB colors", () => {
      const rgb: RGBColor = { r: 255, g: 100, b: 50 };
      const result = colorize("RGB Color", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;100;50mRGB Color\x1b[0m");
    });

    it("should apply hex colors", () => {
      const result = colorize("Hex Color", { color: "#ff6432" });
      expect(result).toBe("\x1b[38;2;255;100;50mHex Color\x1b[0m");
    });

    it("should apply 3-digit hex colors", () => {
      const result = colorize("Short Hex", { color: "#f64" });
      expect(result).toBe("\x1b[38;2;255;102;68mShort Hex\x1b[0m");
    });

    it("should apply 4-bit bright backgrounds", () => {
      const result = colorize("Bright Background", { background: "bgBrightYellow" });
      expect(result).toBe("\x1b[103mBright Background\x1b[0m");
    });

    it("should apply RGB backgrounds", () => {
      const rgb: RGBColor = { r: 255, g: 100, b: 50 };
      const result = colorize("RGB Background", { background: rgb });
      expect(result).toBe("\x1b[48;2;255;100;50mRGB Background\x1b[0m");
    });

    it("should apply hex backgrounds", () => {
      const result = colorize("Hex Background", { background: "#ff6432" });
      expect(result).toBe("\x1b[48;2;255;100;50mHex Background\x1b[0m");
    });
  });

  describe("Style Handling", () => {
    it("should handle reset style by not applying it", () => {
      const result = colorize("Text", { style: "reset", color: "red" });
      expect(result).toBe("\x1b[31mText\x1b[0m");
    });

    it("should handle all available styles", () => {
      const styles: StyleName[] = ["bright", "dim", "underscore", "blink", "reverse", "hidden"];
      const expectedCodes = ["\x1b[1m", "\x1b[2m", "\x1b[4m", "\x1b[5m", "\x1b[7m", "\x1b[8m"];

      styles.forEach((style, index) => {
        const result = colorize("test", { style });
        expect(result).toBe(`${expectedCodes[index]}test\x1b[0m`);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty text with colorizeting", () => {
      const result = colorize("", { color: "red", style: "bright", background: "bgYellow" });
      expect(result).toBe("\x1b[43m\x1b[31m\x1b[1m\x1b[0m");
    });

    it("should handle special characters in text", () => {
      const specialText = "Hello\nWorld\t!@#$%^&*()";
      const result = colorize(specialText, { color: "green" });
      expect(result).toBe(`\x1b[32m${specialText}\x1b[0m`);
    });

    it("should handle unicode characters", () => {
      const unicodeText = "🎉 Hello 世界 🌍";
      const result = colorize(unicodeText, { color: "blue" });
      expect(result).toBe(`\x1b[34m${unicodeText}\x1b[0m`);
    });

    it("should handle very long text", () => {
      const longText = "A".repeat(1000);
      const result = colorize(longText, { color: "red" });
      expect(result).toBe(`\x1b[31m${longText}\x1b[0m`);
    });

    it("should handle text with existing ANSI codes", () => {
      const textWithAnsi = "Hello \x1b[31mRed\x1b[0m World";
      const result = colorize(textWithAnsi, { color: "green" });
      expect(result).toBe(`\x1b[32m${textWithAnsi}\x1b[0m`);
    });

    it("should handle invalid hex colors gracefully", () => {
      const result = colorize("Invalid Hex", { color: "#invalid" as ColorInput });
      expect(result).toBe("Invalid Hex");
    });

    it("should clamp RGB values", () => {
      const rgb: RGBColor = { r: 300, g: -50, b: 128 };
      const result = colorize("Clamped RGB", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;0;128mClamped RGB\x1b[0m");
    });

    it("should handle RGB values with decimals", () => {
      const rgb: RGBColor = { r: 254.7, g: 100.3, b: 50.9 };
      const result = colorize("Decimal RGB", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;100;51mDecimal RGB\x1b[0m");
    });
  });

  describe("Complex Combinations", () => {
    it("should apply RGB color with hex background", () => {
      const result = colorize("Mixed Colors", {
        color: { r: 255, g: 0, b: 0 },
        background: "#ffff00",
      });
      expect(result).toBe("\x1b[48;2;255;255;0m\x1b[38;2;255;0;0mMixed Colors\x1b[0m");
    });

    it("should apply bright colors with style", () => {
      const result = colorize("Bright Styled", {
        color: "brightGreen",
        style: "bright",
        background: "bgBrightBlue",
      });
      expect(result).toBe("\x1b[104m\x1b[92m\x1b[1mBright Styled\x1b[0m");
    });

    it("should handle all color input types", () => {
      const colorInputs: ColorInput[] = ["red", "brightRed", { r: 255, g: 0, b: 0 }, "#ff0000"];

      colorInputs.forEach((color) => {
        const result = colorize("Test", { color });
        expect(result).toContain("Test");
        expect(result).toContain("\x1b[0m");
      });
    });

    it("should handle all background input types", () => {
      const backgroundInputs: BackgroundInput[] = ["bgRed", "bgBrightRed", { r: 255, g: 0, b: 0 }, "#ff0000"];

      backgroundInputs.forEach((background) => {
        const result = colorize("Test", { background });
        expect(result).toContain("Test");
        expect(result).toContain("\x1b[0m");
      });
    });
  });
});

describe("Color Class Integration with colorize Function", () => {
  describe("Basic Color Class Integration", () => {
    it("should use Color class hex output with colorize function", () => {
      const color = new Color("#ff0000");
      const result = colorize("Test", { color: color.hex });
      expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
    });

    it("should use Color class hex output with colorize function", () => {
      const color = new Color("#ff0000");
      const colorName = color.toString(ColorType.Hex);
      const result = colorize("Test", { color: colorName });
      expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
    });

    it("should use Color class RGB values with colorize function", () => {
      const color = new Color(255, 100, 50);
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;100;50mTest\x1b[0m");
    });

    it("should use Color class as background with colorize function", () => {
      const color = new Color("#00ff00");
      const result = colorize("Test", { background: color.hex });
      expect(result).toBe("\x1b[48;2;0;255;0mTest\x1b[0m");
    });
  });

  describe("Color Class Parsing Integration", () => {
    it("should use Color.parse output with colorize function", () => {
      const color = Color.parse("rgb(255, 0, 0)");
      const result = colorize("Test", { color: color.hex });
      expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
    });

    it("should use Color.parse HSL output with colorize function", () => {
      const color = Color.parse("hsl(120, 100%, 50%)");
      const result = colorize("Test", { color: color.hex });
      expect(result).toBe("\x1b[38;2;0;255;0mTest\x1b[0m");
    });

    it("should use Color.parse RGBA output with colorize function", () => {
      const color = Color.parse("rgba(255, 0, 0, 0.5)");
      // Use RGB values directly since hex with alpha may not work with colorize function
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
    });
  });

  describe("Color Class Constructor Variations Integration", () => {
    it("should use Color created with RGB constructor with colorize function", () => {
      const color = new Color(100, 200, 150);
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;100;200;150mTest\x1b[0m");
    });

    it("should use Color created with RGBA constructor with colorize function", () => {
      const color = new Color(255, 128, 64, 0.8);
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;128;64mTest\x1b[0m");
    });

    it("should use Color created with named constructor with colorize function", () => {
      const color = new Color("MyRed", 255, 0, 0);
      const result = colorize("Test", { color: color.hex });
      expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
    });
  });

  describe("Color Class colorize Combinations", () => {
    it("should use Color class for both foreground and background", () => {
      const foregroundColor = new Color("#ff0000");
      const backgroundColor = new Color("#00ff00");
      const result = colorize("Test", {
        color: foregroundColor.hex,
        background: backgroundColor.hex,
      });
      expect(result).toBe("\x1b[48;2;0;255;0m\x1b[38;2;255;0;0mTest\x1b[0m");
    });

    it("should combine Color class with style colorizeting", () => {
      const color = new Color(255, 165, 0); // Orange
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb, style: "bright" });
      expect(result).toBe("\x1b[38;2;255;165;0m\x1b[1mTest\x1b[0m");
    });

    it("should use Color class with all colorize options", () => {
      const textColor = new Color("#ffffff");
      const bgColor = new Color("#ff0000");
      const result = colorize("Critical", {
        color: textColor.hex,
        background: bgColor.hex,
        style: "bright",
      });
      expect(result).toBe("\x1b[48;2;255;0;0m\x1b[38;2;255;255;255m\x1b[1mCritical\x1b[0m");
    });
  });

  describe("Color Class Output colorize Integration", () => {
    it("should use Color class RGB string output with colorize function", () => {
      const color = new Color("#ff6432");
      // Note: RGB string colorize won't work directly with colorize function
      // This tests the behavior when an invalid color input is provided
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = colorize("Test", { color: color.rgb as any });
      expect(result).toBe("Test"); // Should return original text for invalid input
    });

    it("should use Color class HSL string output with colorize function", () => {
      const color = new Color("#ff0000");
      // Note: HSL string colorize won't work directly with colorize function
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = colorize("Test", { color: color.hsl as any });
      expect(result).toBe("Test"); // Should return original text for invalid input
    });

    it("should use Color class toString with different ColorType outputs", () => {
      const color = new Color("#0080ff");

      // Test hex output
      const hexResult = colorize("Test", { color: color.toString(ColorType.Hex) });
      expect(hexResult).toBe("\x1b[38;2;0;128;255mTest\x1b[0m");

      // Test color name output (if available)
      const colorName = color.toString(ColorType.Color);
      if (colorName !== color.hex) {
        // Only test if a valid color name was found
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const nameResult = colorize("Test", { color: colorName as any });
        expect(nameResult).toContain("Test");
        expect(nameResult).toContain("\x1b[0m");
      }
    });
  });

  describe("Color Class Edge Cases Integration", () => {
    it("should handle Color class with alpha values", () => {
      const color = new Color(255, 0, 0, 0.5);
      expect(color.alpha).toBe(0.5);

      // Use the RGB values (alpha is not directly supported by colorize function)
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
    });

    it("should handle Color class with custom names", () => {
      const color = new Color("CustomBlue", "#0066cc");
      expect(color.name).toBe("CustomBlue");

      const result = colorize("Test", { color: color.hex });
      expect(result).toBe("\x1b[38;2;0;102;204mTest\x1b[0m");
    });

    it("should handle Color class round-trip conversion", () => {
      // Create color, convert to hex, use with colorize, verify output
      const originalColor = new Color(128, 64, 192);
      const hexValue = originalColor.hex;
      const result = colorize("Test", { color: hexValue });
      expect(result).toBe("\x1b[38;2;128;64;192mTest\x1b[0m");
    });

    it("should handle Color class with extreme RGB values", () => {
      const color = new Color(0, 255, 0);
      const rgb: RGBColor = { r: color.red, g: color.green, b: color.blue };
      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;0;255;0mTest\x1b[0m");
    });
  });

  describe("Color Class Type Safety Integration", () => {
    it("should work with Color class and typed color inputs", () => {
      const color = new Color("#ff0000");
      const colorName = color.toString(ColorType.Color) as AllColorName;

      if (colorName === "red") {
        const result = colorize("Test", { color: colorName });
        expect(result).toBe("\x1b[31mTest\x1b[0m");
      }
    });

    it("should work with Color class RGB values as typed RGB input", () => {
      const color = new Color(255, 128, 0);
      const rgb: RGBColor = {
        r: color.red,
        g: color.green,
        b: color.blue,
      };

      const result = colorize("Test", { color: rgb });
      expect(result).toBe("\x1b[38;2;255;128;0mTest\x1b[0m");
    });

    it("should work with Color class hex as typed hex input", () => {
      const color = new Color("#ff8000");
      const hexColor: `#${string}` = color.hex;

      const result = colorize("Test", { color: hexColor });
      expect(result).toBe("\x1b[38;2;255;128;0mTest\x1b[0m");
    });
  });
});

describe("Type Safety", () => {
  it("should work with typed color names", () => {
    const color: ColorName = "red";
    const result = colorize("Test", { color });
    expect(result).toBe("\x1b[31mTest\x1b[0m");
  });

  it("should work with typed style names", () => {
    const style: StyleName = "bright";
    const result = colorize("Test", { style });
    expect(result).toBe("\x1b[1mTest\x1b[0m");
  });

  it("should work with typed background names", () => {
    const background: BackgroundName = "bgRed";
    const result = colorize("Test", { background });
    expect(result).toBe("\x1b[41mTest\x1b[0m");
  });

  it("should work with typed bright color names", () => {
    const brightColor: BrightColorName = "brightRed";
    const result = colorize("Test", { color: brightColor });
    expect(result).toBe("\x1b[91mTest\x1b[0m");
  });

  it("should work with typed RGB colors", () => {
    const rgb: RGBColor = { r: 255, g: 0, b: 0 };
    const result = colorize("Test", { color: rgb });
    expect(result).toBe("\x1b[38;2;255;0;0mTest\x1b[0m");
  });

  it("should work with all color name types", () => {
    const allColor: AllColorName = "brightGreen";
    const result = colorize("Test", { color: allColor });
    expect(result).toBe("\x1b[92mTest\x1b[0m");
  });

  it("should work with all background name types", () => {
    const allBackground: AllBackgroundName = "bgBrightRed";
    const result = colorize("Test", { background: allBackground });
    expect(result).toBe("\x1b[101mTest\x1b[0m");
  });
});
