import { Colors } from "@blueprintjs/core";
import { Color, JsonColor, typeofObject } from "@local/common";
import json from "./palettes.json";

export { Color } from "@local/common";
export type { JsonColor } from "@local/common";

/**
 * Represents a default color palette based on Blueprintjs colors.
 */
export enum PaletteName {
  // achromatic
  Black = "Black",
  DarkGray = "DarkGray",
  Gray = "Gray",
  LightGray = "LightGray",
  White = "White",
  // extended
  Vermilion = "Vermilion",
  Violet = "Violet",
  Cerulean = "Cerulean",
  Forest = "Forest",
  Gold = "Gold",
  Rose = "Rose",
  Indigo = "Indigo",
  Turquoise = "Turquoise",
  Lime = "Lime",
  Sepia = "Sepia",
  // core
  Blue = "Blue",
  Orange = "Orange",
  Green = "Green",
  Red = "Red",
}

/**
 * Represents a palette color based on Blueprintjs colors.
 */
export enum PaletteColor {
  Primary = "Primary",
  Secondary = "Secondary",
  Tertiary = "Tertiary",
  Quaternary = "Quaternary",
  Quinary = "Quinary",
}

/**
 * Represents a color palette type.
 * - Achromatic: A palette that contains only shades of gray.
 * - Core: A palette that contains the primary colors.
 * - Extended: A palette that contains additional colors.
 * - Custom: A custom palette.
 */
export enum PaletteType {
  Achromatic = "Achromatic",
  Core = "Core",
  Extended = "Extended",
  Custom = "Custom",
}

/**
 * Represents a color palette scheme.
 * - Sequential: A palette that contains a series of colors that transition from light to dark.
 * - Diverging: A palette that contains a series of colors that are a pair of 2 gradations of colors that meet in the center.
 * - Qualitative: A palette that contains a series of colors that are distinct from each other.
 */
export enum PaletteScheme {
  Sequential = "Sequential",
  Diverging = "Diverging",
  Qualitative = "Qualitative",
}

/**
 * Represents a data scale type for filtering palette types.
 */
export enum ScaleType {
  Categorical = "Categorical",
  Ordinal = "Ordinal",
  Interval = "Interval",
  Ratio = "Ratio",
}

/**
 * JSON representation of a color palette.
 */
export interface JsonPalette {
  name: string;
  type: string;
  scheme: string;
  colors: JsonColor[];
}

export class Palette {
  readonly name: PaletteName | string;
  readonly type: PaletteType | string;
  readonly scheme: PaletteScheme | string;
  readonly colors: Color[];

  constructor(
    name: PaletteName | string,
    type: PaletteType | string,
    scheme: PaletteScheme | string,
    primary: Color,
    secondary: Color,
    tertiary: Color,
    quaternary: Color,
    quinary: Color,
  );
  constructor(
    name: PaletteName | string,
    type: PaletteType | string,
    scheme: PaletteScheme | string,
    ...colors: Color[]
  );
  constructor(
    name: PaletteName | string,
    type: PaletteType | string,
    scheme: PaletteScheme | string,
    ...colors: Color[]
  ) {
    if (colors.length < 1) {
      throw new Error("At least one color is required");
    }
    this.name = name;
    this.type = type;
    this.scheme = scheme;
    this.colors = colors;
  }

  static build(builder: JsonPalette): Palette {
    return new Palette(builder.name, builder.type, builder.scheme, ...builder.colors.map(Color.build));
  }

  get primary(): Color {
    return this.colors[0];
  }

  get secondary(): Color {
    return this.colors[Math.min(1, this.colors.length - 1)];
  }

  get tertiary(): Color {
    return this.colors[Math.min(2, this.colors.length - 1)];
  }

  get quaternary(): Color {
    return this.colors[Math.min(3, this.colors.length - 1)];
  }

  get quinary(): Color {
    return this.colors[Math.min(4, this.colors.length - 1)];
  }

  getColor(index: number): Color;
  getColor(color: PaletteColor): Color;
  getColor(value: number | PaletteColor): Color {
    if (typeof value === "number") {
      if (value < 0 || value >= this.colors.length) {
        throw new Error(`Unknown color value: ${value}`);
      }
      return this.colors[value];
    } else {
      switch (value) {
        case PaletteColor.Primary:
        case "Primary":
          return this.primary;
        case PaletteColor.Secondary:
        case "Secondary":
          return this.secondary;
        case PaletteColor.Tertiary:
        case "Tertiary":
          return this.tertiary;
        case PaletteColor.Quaternary:
        case "Quaternary":
          return this.quaternary;
        case PaletteColor.Quinary:
        case "Quinary":
          return this.quinary;
        default:
          throw new Error(`Unknown color value: ${value}`);
      }
    }
  }

  get length(): number {
    return this.colors.length;
  }

  *[Symbol.iterator](): Generator<Color> {
    for (const color of this.colors) {
      yield color;
    }
  }
}

const blueprintPalettes = Object.values(PaletteName).map((name) => {
  switch (name) {
    case PaletteName.Black:
    case "Black":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("BLACK", Colors.BLACK as `#${string}`),
        new Color("DARK_GRAY3", Colors.DARK_GRAY3 as `#${string}`),
        new Color("GRAY3", Colors.GRAY3 as `#${string}`),
        new Color("LIGHT_GRAY3", Colors.LIGHT_GRAY3 as `#${string}`),
        new Color("WHITE", Colors.WHITE as `#${string}`),
      );
    case PaletteName.DarkGray:
    case "DarkGray":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("DARK_GRAY1", Colors.DARK_GRAY1 as `#${string}`),
        new Color("DARK_GRAY2", Colors.DARK_GRAY2 as `#${string}`),
        new Color("DARK_GRAY3", Colors.DARK_GRAY3 as `#${string}`),
        new Color("DARK_GRAY4", Colors.DARK_GRAY4 as `#${string}`),
        new Color("DARK_GRAY5", Colors.DARK_GRAY5 as `#${string}`),
      );
    case PaletteName.Gray:
    case "Gray":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("GRAY1", Colors.GRAY1 as `#${string}`),
        new Color("GRAY2", Colors.GRAY2 as `#${string}`),
        new Color("GRAY3", Colors.GRAY3 as `#${string}`),
        new Color("GRAY4", Colors.GRAY4 as `#${string}`),
        new Color("GRAY5", Colors.GRAY5 as `#${string}`),
      );
    case PaletteName.LightGray:
    case "LightGray":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("LIGHT_GRAY1", Colors.LIGHT_GRAY1 as `#${string}`),
        new Color("LIGHT_GRAY2", Colors.LIGHT_GRAY2 as `#${string}`),
        new Color("LIGHT_GRAY3", Colors.LIGHT_GRAY3 as `#${string}`),
        new Color("LIGHT_GRAY4", Colors.LIGHT_GRAY4 as `#${string}`),
        new Color("LIGHT_GRAY5", Colors.LIGHT_GRAY5 as `#${string}`),
      );
    case PaletteName.White:
    case "White":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("WHITE", Colors.WHITE as `#${string}`),
        new Color("LIGHT_GRAY3", Colors.LIGHT_GRAY3 as `#${string}`),
        new Color("GRAY3", Colors.GRAY3 as `#${string}`),
        new Color("DARK_GRAY3", Colors.DARK_GRAY3 as `#${string}`),
        new Color("BLACK", Colors.BLACK as `#${string}`),
      );
    case PaletteName.Vermilion:
    case "Vermilion":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("VERMILION1", Colors.VERMILION1 as `#${string}`),
        new Color("VERMILION2", Colors.VERMILION2 as `#${string}`),
        new Color("VERMILION3", Colors.VERMILION3 as `#${string}`),
        new Color("VERMILION4", Colors.VERMILION4 as `#${string}`),
        new Color("VERMILION5", Colors.VERMILION5 as `#${string}`),
      );
    case PaletteName.Rose:
    case "Rose":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("ROSE1", Colors.ROSE1 as `#${string}`),
        new Color("ROSE2", Colors.ROSE2 as `#${string}`),
        new Color("ROSE3", Colors.ROSE3 as `#${string}`),
        new Color("ROSE4", Colors.ROSE4 as `#${string}`),
        new Color("ROSE5", Colors.ROSE5 as `#${string}`),
      );
    case PaletteName.Violet:
    case "Violet":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("VIOLET1", Colors.VIOLET1 as `#${string}`),
        new Color("VIOLET2", Colors.VIOLET2 as `#${string}`),
        new Color("VIOLET3", Colors.VIOLET3 as `#${string}`),
        new Color("VIOLET4", Colors.VIOLET4 as `#${string}`),
        new Color("VIOLET5", Colors.VIOLET5 as `#${string}`),
      );
    case PaletteName.Indigo:
    case "Indigo":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("INDIGO1", Colors.INDIGO1 as `#${string}`),
        new Color("INDIGO2", Colors.INDIGO2 as `#${string}`),
        new Color("INDIGO3", Colors.INDIGO3 as `#${string}`),
        new Color("INDIGO4", Colors.INDIGO4 as `#${string}`),
        new Color("INDIGO5", Colors.INDIGO5 as `#${string}`),
      );
    case PaletteName.Cerulean:
    case "Cerulean":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("CERULEAN1", Colors.CERULEAN1 as `#${string}`),
        new Color("CERULEAN2", Colors.CERULEAN2 as `#${string}`),
        new Color("CERULEAN3", Colors.CERULEAN3 as `#${string}`),
        new Color("CERULEAN4", Colors.CERULEAN4 as `#${string}`),
        new Color("CERULEAN5", Colors.CERULEAN5 as `#${string}`),
      );
    case PaletteName.Turquoise:
    case "Turquoise":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("TURQUOISE1", Colors.TURQUOISE1 as `#${string}`),
        new Color("TURQUOISE2", Colors.TURQUOISE2 as `#${string}`),
        new Color("TURQUOISE3", Colors.TURQUOISE3 as `#${string}`),
        new Color("TURQUOISE4", Colors.TURQUOISE4 as `#${string}`),
        new Color("TURQUOISE5", Colors.TURQUOISE5 as `#${string}`),
      );
    case PaletteName.Forest:
    case "Forest":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("FOREST1", Colors.FOREST1 as `#${string}`),
        new Color("FOREST2", Colors.FOREST2 as `#${string}`),
        new Color("FOREST3", Colors.FOREST3 as `#${string}`),
        new Color("FOREST4", Colors.FOREST4 as `#${string}`),
        new Color("FOREST5", Colors.FOREST5 as `#${string}`),
      );
    case PaletteName.Lime:
    case "Lime":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("LIME1", Colors.LIME1 as `#${string}`),
        new Color("LIME2", Colors.LIME2 as `#${string}`),
        new Color("LIME3", Colors.LIME3 as `#${string}`),
        new Color("LIME4", Colors.LIME4 as `#${string}`),
        new Color("LIME5", Colors.LIME5 as `#${string}`),
      );
    case PaletteName.Gold:
    case "Gold":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("GOLD1", Colors.GOLD1 as `#${string}`),
        new Color("GOLD2", Colors.GOLD2 as `#${string}`),
        new Color("GOLD3", Colors.GOLD3 as `#${string}`),
        new Color("GOLD4", Colors.GOLD4 as `#${string}`),
        new Color("GOLD5", Colors.GOLD5 as `#${string}`),
      );
    case PaletteName.Sepia:
    case "Sepia":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("SEPIA1", Colors.SEPIA1 as `#${string}`),
        new Color("SEPIA2", Colors.SEPIA2 as `#${string}`),
        new Color("SEPIA3", Colors.SEPIA3 as `#${string}`),
        new Color("SEPIA4", Colors.SEPIA4 as `#${string}`),
        new Color("SEPIA5", Colors.SEPIA5 as `#${string}`),
      );
    case PaletteName.Blue:
    case "Blue":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("BLUE1", Colors.BLUE1 as `#${string}`),
        new Color("BLUE2", Colors.BLUE2 as `#${string}`),
        new Color("BLUE3", Colors.BLUE3 as `#${string}`),
        new Color("BLUE4", Colors.BLUE4 as `#${string}`),
        new Color("BLUE5", Colors.BLUE5 as `#${string}`),
      );
    case PaletteName.Green:
    case "Green":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("GREEN1", Colors.GREEN1 as `#${string}`),
        new Color("GREEN2", Colors.GREEN2 as `#${string}`),
        new Color("GREEN3", Colors.GREEN3 as `#${string}`),
        new Color("GREEN4", Colors.GREEN4 as `#${string}`),
        new Color("GREEN5", Colors.GREEN5 as `#${string}`),
      );
    case PaletteName.Orange:
    case "Orange":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("ORANGE1", Colors.ORANGE1 as `#${string}`),
        new Color("ORANGE2", Colors.ORANGE2 as `#${string}`),
        new Color("ORANGE3", Colors.ORANGE3 as `#${string}`),
        new Color("ORANGE4", Colors.ORANGE4 as `#${string}`),
        new Color("ORANGE5", Colors.ORANGE5 as `#${string}`),
      );
    case PaletteName.Red:
    case "Red":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("RED1", Colors.RED1 as `#${string}`),
        new Color("RED2", Colors.RED2 as `#${string}`),
        new Color("RED3", Colors.RED3 as `#${string}`),
        new Color("RED4", Colors.RED4 as `#${string}`),
        new Color("RED5", Colors.RED5 as `#${string}`),
      );
    default:
      throw new Error(`Unknown palette name: ${name}`);
  }
});
const customPalettes = (json as JsonPalettes).palettes.map((palette) => Palette.build(palette));

export type TypeOrTypes = { type: PaletteType | string } | { types: (PaletteType | string)[] };
export type SchemeOrSchemes = { scheme: PaletteScheme | string } | { schemes: (PaletteScheme | string)[] };

const typeFilter = (options: TypeOrTypes | {}, palette: Palette): boolean => {
  if (typeofObject<{ type: PaletteType }>(options, (v) => "type" in v)) {
    return palette.type === options.type;
  } else if (typeofObject<{ types: (PaletteType | string)[] }>(options, (v) => "types" in v)) {
    return options.types.includes(palette.type);
  } else {
    return true;
  }
};

const schemeFilter = (options: SchemeOrSchemes | {}, palette: Palette): boolean => {
  if (typeofObject<{ scheme: PaletteScheme }>(options, (v) => "scheme" in v)) {
    return palette.scheme === options.scheme;
  } else if (typeofObject<{ schemes: (PaletteScheme | string)[] }>(options, (v) => "schemes" in v)) {
    return options.schemes.includes(palette.scheme);
  } else {
    return true;
  }
};

const scaleFilter = (options: { scale: ScaleType }, palette: Palette): boolean => {
  switch (options.scale) {
    case ScaleType.Categorical:
      return PaletteScheme.Qualitative === palette.scheme;
    case ScaleType.Ordinal:
      return ([PaletteScheme.Sequential, PaletteScheme.Diverging] as (PaletteScheme | string)[]).includes(
        palette.scheme,
      );
    case ScaleType.Interval:
      return PaletteScheme.Sequential === palette.scheme;
    case ScaleType.Ratio:
      return PaletteScheme.Diverging === palette.scheme;
    default:
      throw new Error(`Unhandled scale type: ${options.scale}`);
  }
};

export const allPalettes = [...blueprintPalettes, ...customPalettes] as const;
export const allTypes = [...new Set(allPalettes.map((palette) => palette.type))] as const;
export const allSchemes = [...new Set(allPalettes.map((palette) => palette.scheme))] as const;

export interface JsonPalettes {
  palettes: JsonPalette[];
}

export class Palettes {
  readonly palettes: Palette[];
  readonly types: (PaletteType | string)[];
  readonly schemes: (PaletteScheme | string)[];

  constructor(palettes: readonly Palette[] = allPalettes) {
    this.palettes = [...palettes];
    if (this.palettes.length !== new Set(this.palettes.map((palette) => palette.name)).size) {
      throw new Error("Duplicate palette names");
    }
    this.types = [...new Set(this.palettes.map((palette) => palette.type))];
    this.schemes = [...new Set(this.palettes.map((palette) => palette.scheme))];
  }

  static build(builder: JsonPalettes): Palettes {
    return new Palettes(builder.palettes.map(Palette.build));
  }

  static getPalette(index: number, fallback?: Palette): Palette;
  static getPalette(name: string, fallback?: Palette): Palette;
  static getPalette(name: PaletteName, fallback?: Palette): Palette;
  static getPalette(value: number | string | PaletteName, fallback?: Palette): Palette {
    let palette: Palette | undefined;
    if (typeof value === "number") {
      return allPalettes[value];
    } else {
      palette = allPalettes.find((palette) => palette.name === value) ?? fallback;
    }
    if (palette === undefined) {
      throw new Error(`Unknown palette name: ${value}`);
    }
    return palette;
  }

  static getPalettes(options: { scale: ScaleType }): Palettes;
  static getPalettes(options: (TypeOrTypes | {}) & (SchemeOrSchemes | {})): Palettes;
  static getPalettes(options: ((TypeOrTypes | {}) & (SchemeOrSchemes | {})) | { scale: ScaleType }): Palettes {
    if (typeofObject<{ scale: ScaleType }>(options, (v) => "scale" in v)) {
      return new Palettes(allPalettes.filter((palette) => scaleFilter(options, palette)));
    } else {
      return new Palettes(
        allPalettes.filter((palette) => typeFilter(options, palette) && schemeFilter(options, palette)),
      );
    }
  }

  static get types(): readonly (PaletteType | string)[] {
    return allTypes;
  }

  static get schemes(): readonly (PaletteScheme | string)[] {
    return allSchemes;
  }

  static get length(): number {
    return allPalettes.length;
  }

  static *[Symbol.iterator](): Generator<Palette> {
    for (const color of allPalettes) {
      yield color;
    }
  }

  addPalette(palette: Palette): void {
    if (this.palettes.some((p) => p.name === palette.name)) {
      throw new Error(`Palette name already exists: ${palette.name}`);
    }
    this.palettes.push(palette);
  }

  removePalette(index: number): void;
  removePalette(name: string): void;
  removePalette(name: PaletteName): void;
  removePalette(value: number | string | PaletteName): void {
    let index: number;
    if (typeof value === "number") {
      index = value;
    } else {
      index = this.palettes.findIndex((palette) => palette.name === value);
    }
    if (index === -1) {
      throw new Error(`Unknown palette name: ${value}`);
    }
    this.palettes.splice(index, 1);
  }

  getPalette(index: number, fallback?: Palette): Palette;
  getPalette(name: string, fallback?: Palette): Palette;
  getPalette(name: PaletteName, fallback?: Palette): Palette;
  getPalette(value: number | string | PaletteName, fallback?: Palette): Palette {
    let palette: Palette | undefined;
    if (typeof value === "number") {
      return this.palettes[value];
    } else {
      palette = this.palettes.find((palette) => palette.name === value) ?? fallback;
    }
    if (palette === undefined) {
      throw new Error(`Unknown palette name: ${value}`);
    }
    return palette;
  }

  getPalettes(options: { scale: ScaleType }): Palettes;
  getPalettes(options: (TypeOrTypes | {}) & (SchemeOrSchemes | {})): Palettes;
  getPalettes(options: ((TypeOrTypes | {}) & (SchemeOrSchemes | {})) | { scale: ScaleType }): Palettes {
    if (typeofObject<{ scale: ScaleType }>(options, (v) => "scale" in v)) {
      return new Palettes(this.palettes.filter((palette) => scaleFilter(options, palette)));
    } else {
      return new Palettes(
        this.palettes.filter((palette) => typeFilter(options, palette) && schemeFilter(options, palette)),
      );
    }
  }

  get length(): number {
    return this.palettes.length;
  }

  *[Symbol.iterator](): Generator<Palette> {
    for (const color of this.palettes) {
      yield color;
    }
  }
}
