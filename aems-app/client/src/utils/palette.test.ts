import { Colors } from "@blueprintjs/core";
import {
  Palette,
  PaletteName,
  PaletteType,
  PaletteScheme,
  PaletteColor,
  Palettes,
  ScaleType,
  allPalettes,
  Color,
} from "./palette";
import { ColorType } from "@local/common";

describe("Palette", () => {
  const palette = new Palette(
    PaletteName.Blue,
    PaletteType.Core,
    PaletteScheme.Sequential,
    Color.parse("#0000FF"),
    Color.parse("#0000EE"),
    Color.parse("#0000DD"),
    Color.parse("#0000CC"),
    Color.parse("#0000BB"),
  );

  it("should have the correct name", () => {
    expect(palette.name).toEqual(PaletteName.Blue);
  });

  it("should have the correct type", () => {
    expect(palette.type).toEqual(PaletteType.Core);
  });

  it("should have the correct scheme", () => {
    expect(palette.scheme).toEqual(PaletteScheme.Sequential);
  });

  it("should have the correct primary color", () => {
    expect(palette.primary.toString()).toEqual("#0000ff");
  });

  it("should have the correct secondary color", () => {
    expect(palette.secondary.toString()).toEqual("#0000ee");
  });

  it("should have the correct tertiary color", () => {
    expect(palette.tertiary.toString()).toEqual("#0000dd");
  });

  it("should have the correct quaternary color", () => {
    expect(palette.quaternary.toString()).toEqual("#0000cc");
  });

  it("should have the correct quinary color", () => {
    expect(palette.quinary.toString()).toEqual("#0000bb");
  });

  it("should return the correct color by index", () => {
    expect(palette.getColor(0).toString()).toEqual("#0000ff");
    expect(palette.getColor(1).toString()).toEqual("#0000ee");
    expect(palette.getColor(2).toString()).toEqual("#0000dd");
    expect(palette.getColor(3).toString()).toEqual("#0000cc");
    expect(palette.getColor(4).toString()).toEqual("#0000bb");
  });

  it("should return the correct color by PaletteColor enum", () => {
    expect(palette.getColor(PaletteColor.Primary).toString()).toEqual("#0000ff");
    expect(palette.getColor(PaletteColor.Secondary).toString()).toEqual("#0000ee");
    expect(palette.getColor(PaletteColor.Tertiary).toString()).toEqual("#0000dd");
    expect(palette.getColor(PaletteColor.Quaternary).toString()).toEqual("#0000cc");
    expect(palette.getColor(PaletteColor.Quinary).toString()).toEqual("#0000bb");
  });

  it("should throw an error for an unknown color value", () => {
    expect(() => palette.getColor(5)).toThrow(new Error("Unknown color value: 5"));
  });

  it("should return the correct length", () => {
    expect(palette.length).toEqual(5);
  });

  it("should iterate over all colors", () => {
    const expected = ["#0000ff", "#0000ee", "#0000dd", "#0000cc", "#0000bb"];
    const actual = [...palette].map((color) => color.toString());
    expect(actual).toEqual(expected);
  });
});

describe("Palettes", () => {
  let palettes: Palettes;

  beforeEach(() => {
    palettes = new Palettes();
  });

  it("should have the correct length", () => {
    expect(palettes.length).toEqual(allPalettes.length);
  });

  it("should get a palette by index", () => {
    const palette = palettes.getPalette(0);
    expect(palette).toBeDefined();
    expect(palette.name).toEqual(PaletteName.Black);
  });

  it("should get a palette by name", () => {
    const palette = palettes.getPalette(PaletteName.Green);
    expect(palette).toBeDefined();
    expect(palette.name).toEqual(PaletteName.Green);
  });

  it("should throw an error for an unknown palette name", () => {
    expect(() => palettes.getPalette("Unknown")).toThrow(new Error("Unknown palette name: Unknown"));
  });

  it("should iterate over all palettes", () => {
    const expected = [PaletteName.Blue, PaletteName.Orange, PaletteName.Green, PaletteName.Red];
    const actual = [...Palettes.getPalettes({ type: PaletteType.Core })].map((palette) => palette.name);
    expect(actual).toEqual(expected);
  });

  it("should add a new palette", () => {
    const newPalette = new Palette(
      "Rainbow",
      PaletteType.Custom,
      PaletteScheme.Qualitative,
      new Color(Colors.RED3 as `#${string}`),
      new Color(Colors.ORANGE3 as `#${string}`),
      new Color(Colors.GOLD3 as `#${string}`),
      new Color(Colors.GREEN3 as `#${string}`),
      new Color(Colors.BLUE3 as `#${string}`),
      new Color(Colors.INDIGO3 as `#${string}`),
      new Color(Colors.VIOLET3 as `#${string}`),
    );
    palettes.addPalette(newPalette);
    expect(palettes.length).toEqual(allPalettes.length + 1);
    expect(palettes.getPalette("Rainbow")).toEqual(newPalette);
  });

  it("should remove a palette by index", () => {
    palettes.removePalette(0);
    expect(palettes.length).toEqual(allPalettes.length - 1);
    expect(() => palettes.getPalette(PaletteName.Black)).toThrow(new Error("Unknown palette name: Black"));
  });

  it("should remove a palette by name", () => {
    palettes.removePalette(PaletteName.Green);
    expect(palettes.length).toEqual(allPalettes.length - 1);
    expect(() => palettes.getPalette(PaletteName.Green)).toThrow(new Error("Unknown palette name: Green"));
  });

  it("should throw an error when removing an unknown palette name", () => {
    expect(() => palettes.removePalette("Unknown")).toThrow(new Error("Unknown palette name: Unknown"));
  });

  it("should filter palettes by type and scheme", () => {
    const filteredPalettes = Palettes.getPalettes({
      types: [PaletteType.Core],
      schemes: [PaletteScheme.Sequential],
    });
    expect(filteredPalettes.length).toEqual(4);
    expect(filteredPalettes.getPalette(0).name).toEqual(PaletteName.Blue);
  });

  it("should filter palettes by type and scheme for instance", () => {
    const filteredPalettes = new Palettes().getPalettes({
      types: [PaletteType.Core],
      schemes: [PaletteScheme.Sequential],
    });
    expect(filteredPalettes.length).toEqual(4);
    expect(filteredPalettes.getPalette(0).name).toEqual(PaletteName.Blue);
  });
});
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
    it("should parse a color in hex format", () => {
      const color = Color.parse("#ff0000");
      expect(color.hex).toEqual("#ff0000");
    });

    it("should parse a color in RGB format", () => {
      const color = Color.parse("rgb(255, 0, 0)");
      expect(color.hex).toEqual("#ff0000");
    });

    it("should parse a color in RGBA format", () => {
      const color = Color.parse("rgba(255, 0, 0, 0.5)");
      expect(color.hex).toEqual("#ff000080");
    });

    it("should parse a color in HSL format", () => {
      const color = Color.parse("hsl(0, 100%, 50%)");
      expect(color.hex).toEqual("#ff0000");
    });

    it("should parse a color in HSLA format", () => {
      const color = Color.parse("hsla(0, 100%, 50%, 0.5)");
      expect(color.hex).toEqual("#ff000080");
    });

    it("should throw an error for an invalid color format", () => {
      expect(() => Color.parse("invalid-color")).toThrow(new Error("Invalid color values"));
    });
  });
});

describe("Palette — error branches", () => {
  it("throws when constructed with zero colors", () => {
    expect(() => new Palette("X", PaletteType.Custom, PaletteScheme.Qualitative)).toThrow(
      "At least one color is required",
    );
  });

  it("getColor throws for unknown PaletteColor enum value", () => {
    const p = new Palette("X", PaletteType.Custom, PaletteScheme.Qualitative, new Color("#ff0000"));
    expect(() => p.getColor("Senary" as PaletteColor)).toThrow(/Unknown color value/);
  });
});

describe("Palettes — static methods and instance coverage", () => {
  it("Palettes.build constructs from JsonPalettes", () => {
    const json = {
      palettes: [
        {
          name: "TestPalette",
          type: PaletteType.Custom,
          scheme: PaletteScheme.Qualitative,
          colors: [{ name: "Red", hex: "#ff0000" }],
        },
      ],
    };
    const p = Palettes.build(json as any);
    expect(p.length).toBe(1);
    expect(p.getPalette("TestPalette").name).toBe("TestPalette");
  });

  it("Palettes.getPalette with fallback returns fallback for unknown name", () => {
    const fallback = allPalettes[0];
    const result = Palettes.getPalette("DoesNotExist", fallback);
    expect(result).toBe(fallback);
  });

  it("Palettes.getPalette throws without fallback for unknown name", () => {
    expect(() => Palettes.getPalette("DoesNotExist")).toThrow("Unknown palette name: DoesNotExist");
  });

  it("Palettes.getPalette by index returns correct palette", () => {
    const result = Palettes.getPalette(0);
    expect(result).toBeDefined();
    expect(result.name).toBe(allPalettes[0].name);
  });

  it("Palettes static Symbol.iterator yields all palettes", () => {
    const collected = [...Palettes];
    expect(collected.length).toBe(allPalettes.length);
  });

  it("Palettes instance Symbol.iterator yields instance palettes", () => {
    const p = new Palettes();
    const collected = [...p];
    expect(collected.length).toBe(allPalettes.length);
  });

  it("instance getPalette by index returns correct palette", () => {
    const p = new Palettes();
    const result = p.getPalette(0);
    expect(result).toBeDefined();
  });

  it("instance getPalette with fallback returns fallback for unknown", () => {
    const p = new Palettes();
    const fallback = allPalettes[0];
    const result = p.getPalette("DoesNotExist", fallback);
    expect(result).toBe(fallback);
  });

  it("Palettes constructor throws on duplicate names", () => {
    const dup = allPalettes[0];
    expect(() => new Palettes([dup, dup])).toThrow("Duplicate palette names");
  });

  it("addPalette throws on duplicate name", () => {
    const p = new Palettes();
    expect(() => p.addPalette(allPalettes[0])).toThrow(/already exists/);
  });
});

describe("Palettes — ScaleType filtering", () => {
  it("Categorical scale returns Qualitative palettes", () => {
    const result = Palettes.getPalettes({ scale: ScaleType.Categorical });
    expect(result.schemes).toEqual([PaletteScheme.Qualitative]);
  });

  it("Ordinal scale returns Sequential and Diverging palettes", () => {
    const result = Palettes.getPalettes({ scale: ScaleType.Ordinal });
    const schemes = [...new Set(result.palettes.map((p) => p.scheme))];
    expect(schemes.every((s) => [PaletteScheme.Sequential, PaletteScheme.Diverging].includes(s as PaletteScheme))).toBe(
      true,
    );
  });

  it("Interval scale returns Sequential palettes only", () => {
    const result = Palettes.getPalettes({ scale: ScaleType.Interval });
    expect(result.schemes).toEqual([PaletteScheme.Sequential]);
  });

  it("Ratio scale returns Diverging palettes only", () => {
    const result = Palettes.getPalettes({ scale: ScaleType.Ratio });
    expect(result.schemes).toEqual([PaletteScheme.Diverging]);
  });

  it("instance getPalettes with scale delegates to scaleFilter", () => {
    const result = new Palettes().getPalettes({ scale: ScaleType.Categorical });
    expect(result.length).toBeGreaterThan(0);
    expect(result.schemes).toEqual([PaletteScheme.Qualitative]);
  });

  it("Palettes.getPalettes with no type/scheme options returns all palettes", () => {
    const result = Palettes.getPalettes({});
    expect(result.length).toEqual(allPalettes.length);
  });

  it("filter by single type (not array)", () => {
    const result = Palettes.getPalettes({ type: PaletteType.Core });
    expect(result.palettes.every((p) => p.type === PaletteType.Core)).toBe(true);
  });

  it("filter by single scheme (not array)", () => {
    const result = Palettes.getPalettes({ scheme: PaletteScheme.Sequential });
    expect(result.palettes.every((p) => p.scheme === PaletteScheme.Sequential)).toBe(true);
  });
});
