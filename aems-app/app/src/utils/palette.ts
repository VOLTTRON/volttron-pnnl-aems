import { Colors } from "@blueprintjs/core";
import { typeofObject } from "./util";
import json from "./palettes.json";

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
 * Represents an input or output format for a color.
 */
export enum ColorType {
  Color = "Color",
  Hex = "Hex",
  HexA = "HexA",
  RGB = "RGB",
  RGBA = "RGBA",
  HSL = "HSL",
  HSLA = "HSLA",
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

const wordToHex: Record<string, string> = {
  aliceblue: "#f0f8ff",
  antiquewhite: "#faebd7",
  aqua: "#00ffff",
  aquamarine: "#7fffd4",
  azure: "#f0ffff",
  beige: "#f5f5dc",
  bisque: "#ffe4c4",
  black: "#000000",
  blanchedalmond: "#ffebcd",
  blue: "#0000ff",
  blueviolet: "#8a2be2",
  brown: "#a52a2a",
  burlywood: "#deb887",
  cadetblue: "#5f9ea0",
  chartreuse: "#7fff00",
  chocolate: "#d2691e",
  coral: "#ff7f50",
  cornflowerblue: "#6495ed",
  cornsilk: "#fff8dc",
  crimson: "#dc143c",
  cyan: "#00ffff",
  darkblue: "#00008b",
  darkcyan: "#008b8b",
  darkgoldenrod: "#b8860b",
  darkgray: "#a9a9a9",
  darkgrey: "#a9a9a9",
  darkgreen: "#006400",
  darkkhaki: "#bdb76b",
  darkmagenta: "#8b008b",
  darkolivegreen: "#556b2f",
  darkorange: "#ff8c00",
  darkorchid: "#9932cc",
  darkred: "#8b0000",
  darksalmon: "#e9967a",
  darkseagreen: "#8fbc8f",
  darkslateblue: "#483d8b",
  darkslategray: "#2f4f4f",
  darkslategrey: "#2f4f4f",
  darkturquoise: "#00ced1",
  darkviolet: "#9400d3",
  deeppink: "#ff1493",
  deepskyblue: "#00bfff",
  dimgray: "#696969",
  dimgrey: "#696969",
  dodgerblue: "#1e90ff",
  firebrick: "#b22222",
  floralwhite: "#fffaf0",
  forestgreen: "#228b22",
  fuchsia: "#ff00ff",
  gainsboro: "#dcdcdc",
  ghostwhite: "#f8f8ff",
  gold: "#ffd700",
  goldenrod: "#daa520",
  gray: "#808080",
  grey: "#808080",
  green: "#008000",
  greenyellow: "#adff2f",
  honeydew: "#f0fff0",
  hotpink: "#ff69b4",
  indianred: "#cd5c5c",
  indigo: "#4b0082",
  ivory: "#fffff0",
  khaki: "#f0e68c",
  lavender: "#e6e6fa",
  lavenderblush: "#fff0f5",
  lawngreen: "#7cfc00",
  lemonchiffon: "#fffacd",
  lightblue: "#add8e6",
  lightcoral: "#f08080",
  lightcyan: "#e0ffff",
  lightgoldenrodyellow: "#fafad2",
  lightgray: "#d3d3d3",
  lightgrey: "#d3d3d3",
  lightgreen: "#90ee90",
  lightpink: "#ffb6c1",
  lightsalmon: "#ffa07a",
  lightseagreen: "#20b2aa",
  lightskyblue: "#87cefa",
  lightslategray: "#778899",
  lightslategrey: "#778899",
  lightsteelblue: "#b0c4de",
  lightyellow: "#ffffe0",
  lime: "#00ff00",
  limegreen: "#32cd32",
  linen: "#faf0e6",
  magenta: "#ff00ff",
  maroon: "#800000",
  mediumaquamarine: "#66cdaa",
  mediumblue: "#0000cd",
  mediumorchid: "#ba55d3",
  mediumpurple: "#9370db",
  mediumseagreen: "#3cb371",
  mediumslateblue: "#7b68ee",
  mediumspringgreen: "#00fa9a",
  mediumturquoise: "#48d1cc",
  mediumvioletred: "#c71585",
  midnightblue: "#191970",
  mintcream: "#f5fffa",
  mistyrose: "#ffe4e1",
  moccasin: "#ffe4b5",
  navajowhite: "#ffdead",
  navy: "#000080",
  oldlace: "#fdf5e6",
  olive: "#808000",
  olivedrab: "#6b8e23",
  orange: "#ffa500",
  orangered: "#ff4500",
  orchid: "#da70d6",
  palegoldenrod: "#eee8aa",
  palegreen: "#98fb98",
  paleturquoise: "#afeeee",
  palevioletred: "#db7093",
  papayawhip: "#ffefd5",
  peachpuff: "#ffdab9",
  peru: "#cd853f",
  pink: "#ffc0cb",
  plum: "#dda0dd",
  powderblue: "#b0e0e6",
  purple: "#800080",
  rebeccapurple: "#663399",
  red: "#ff0000",
  rosybrown: "#bc8f8f",
  royalblue: "#4169e1",
  saddlebrown: "#8b4513",
  salmon: "#fa8072",
  sandybrown: "#f4a460",
  seagreen: "#2e8b57",
  seashell: "#fff5ee",
  sienna: "#a0522d",
  silver: "#c0c0c0",
  skyblue: "#87ceeb",
  slateblue: "#6a5acd",
  slategray: "#708090",
  slategrey: "#708090",
  snow: "#fffafa",
  springgreen: "#00ff7f",
  steelblue: "#4682b4",
  tan: "#d2b48c",
  teal: "#008080",
  thistle: "#d8bfd8",
  tomato: "#ff6347",
  turquoise: "#40e0d0",
  violet: "#ee82ee",
  wheat: "#f5deb3",
  white: "#ffffff",
  whitesmoke: "#f5f5f5",
  yellow: "#ffff00",
  yellowgreen: "#9acd32",
};

const hexToWord = Object.fromEntries(Object.entries(wordToHex).map(([k, v]) => [v, k]));

const toHex = (color: string) => wordToHex[color.toLowerCase()];
const fromHex = (hex: string): string => hexToWord[hex.toLowerCase()];
const hsl2rgb = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
};

function isString(value: string | number | undefined): value is string {
  return typeof value === "string";
}
function isNumber(value: string | number): value is number {
  return typeof value === "number";
}
function isColor(value: string | number): value is string {
  return isString(value) && wordToHex.hasOwnProperty(value.toLowerCase());
}
function isHex(value: string | number): value is string {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6,8}$/.test(value);
}
function error(error: string): never {
  throw new Error(error);
}

/**
 * JSON representation of a color.
 */
export interface JsonColor {
  name: string;
  hex: string;
}

export class Color {
  readonly name: string;
  readonly hex: string;

  constructor(hex: string);
  constructor(name: string, hex: string);
  constructor(red: number, green: number, blue: number);
  constructor(red: number, green: number, blue: number, alpha: number);
  constructor(name: string, red: number, green: number, blue: number);
  constructor(name: string, red: number, green: number, blue: number, alpha: number);
  constructor(...values: (string | number)[]) {
    let name = "";
    let hex = "";
    if (values.length === 1 && isHex(values[0])) {
      hex = values[0];
    } else if (values.length === 1 && isColor(values[0])) {
      hex = toHex(values[0]);
    } else if (values.length === 2 && isString(values[0]) && isHex(values[1])) {
      name = values[0];
      hex = values[1];
    } else if (values.length === 2 && isString(values[0]) && isColor(values[1])) {
      name = values[0];
      hex = toHex(values[1]);
    } else if (values.every((value) => typeof value === "number")) {
      name = "";
      hex = `#${values
        .map((value, i) => (i === 3 ? Math.round((value as number) * 255) : value).toString(16).padStart(2, "0"))
        .join("")}`;
    } else if (
      (values.length === 4 || values.length === 5) &&
      isString(values[0]) &&
      values.slice(1).every((value) => typeof value === "number")
    ) {
      name = values[0];
      hex = `#${values
        .slice(1)
        .filter(isNumber)
        .map((value, i) => (i === 3 ? Math.round((value as number) * 255) : value).toString(16).padStart(2, "0"))
        .join("")}`;
    } else {
      error("Invalid color values");
    }
    this.name = isString(name) ? name : error(`Invalid color name: ${name}`);
    this.hex = isHex(hex) ? hex.toLocaleLowerCase() : error(`Invalid color hex: ${hex}`);
  }

  static build(builder: JsonColor): Color {
    return new Color(builder.name, builder.hex);
  }

  static parse(value: string): Color;
  static parse(name: string, value: string): Color;
  static parse(first: string, second?: string): Color {
    const name = isString(second) ? first : "";
    const value = isString(second) ? second : first;
    if (/rgb\(\d{1,3}, ?\d{1,3}, ?\d{1,3}\)/.test(value)) {
      const [, r, g, b] = /rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)/.exec(value) ?? [];
      return new Color(parseInt(r), parseInt(g), parseInt(b));
    } else if (/rgba\(\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?0?\.\d+\)/.test(value)) {
      const [, r, g, b, a] = /rgba\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3}), ?(0?\.\d+)\)/.exec(value) ?? [];
      return new Color(parseInt(r), parseInt(g), parseInt(b), parseFloat(a));
    } else if (/hsl\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%\)/.test(value)) {
      const [, h, s, l] = /hsl\((\d{1,3}), ?(\d{1,3})%, ?(\d{1,3})%\)/.exec(value) ?? [];
      const [r, g, b] = hsl2rgb(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
      return new Color(r * 255, g * 255, b * 255);
    } else if (/hsla\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%, ?0?\.\d+\)/.test(value)) {
      const [, h, s, l, a] = /hsla\((\d{1,3}), ?(\d{1,3})%, ?(\d{1,3})%, ?(0?\.\d+)\)/.exec(value) ?? [];
      const [r, g, b] = hsl2rgb(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
      return new Color(r * 255, g * 255, b * 255, parseFloat(a));
    }
    return new Color(name, value);
  }

  get red(): number {
    return parseInt(this.hex.slice(1, 3), 16);
  }

  get green(): number {
    return parseInt(this.hex.slice(3, 5), 16);
  }

  get blue(): number {
    return parseInt(this.hex.slice(5, 7), 16);
  }

  get alpha(): number {
    return this.hex.length === 9 ? Math.round((parseInt(this.hex.slice(7, 9), 16) / 255) * 100) / 100 : 1;
  }

  get rgb(): string {
    return `rgb(${this.red}, ${this.green}, ${this.blue})`;
  }

  get rgba(): string {
    return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
  }

  get hsl(): string {
    const r = this.red / 255;
    const g = this.green / 255;
    const b = this.blue / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  }

  get hsla(): string {
    return this.hsl.replace("hsl", "hsla").replace(")", `, ${this.alpha})`);
  }

  toString(type?: ColorType): string {
    switch (type) {
      case ColorType.Hex:
        return this.hex.slice(0, 7);
      case ColorType.HexA:
        return this.hex.length === 9 ? this.hex.slice(0, 7) : `${this.hex}ff`;
      case ColorType.RGB:
        return this.rgb;
      case ColorType.RGBA:
        return this.rgba;
      case ColorType.HSL:
        return this.hsl;
      case ColorType.HSLA:
        return this.hsla;
      case ColorType.Color:
        const color = fromHex(this.hex);
        return color ?? this.hex;
      default:
        return this.hex;
    }
  }

  valueOf(): string {
    return this.hex;
  }

  [Symbol.toPrimitive](hint: "number"): number;
  [Symbol.toPrimitive](hint: "string"): string;
  [Symbol.toPrimitive](hint: "default"): string;
  [Symbol.toPrimitive](hint: string): string | number | boolean | undefined {
    switch (hint) {
      case "number":
        return this.hex.length === 9 ? parseInt(this.hex.slice(0, 7), 16) : parseInt(this.hex, 16);
      case "string":
      case "default":
        return this.hex;
      default:
        return true;
    }
  }
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
    quinary: Color
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
        new Color("BLACK", Colors.BLACK),
        new Color("DARK_GRAY3", Colors.DARK_GRAY3),
        new Color("GRAY3", Colors.GRAY3),
        new Color("LIGHT_GRAY3", Colors.LIGHT_GRAY3),
        new Color("WHITE", Colors.WHITE)
      );
    case PaletteName.DarkGray:
    case "DarkGray":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("DARK_GRAY1", Colors.DARK_GRAY1),
        new Color("DARK_GRAY2", Colors.DARK_GRAY2),
        new Color("DARK_GRAY3", Colors.DARK_GRAY3),
        new Color("DARK_GRAY4", Colors.DARK_GRAY4),
        new Color("DARK_GRAY5", Colors.DARK_GRAY5)
      );
    case PaletteName.Gray:
    case "Gray":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("GRAY1", Colors.GRAY1),
        new Color("GRAY2", Colors.GRAY2),
        new Color("GRAY3", Colors.GRAY3),
        new Color("GRAY4", Colors.GRAY4),
        new Color("GRAY5", Colors.GRAY5)
      );
    case PaletteName.LightGray:
    case "LightGray":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("LIGHT_GRAY1", Colors.LIGHT_GRAY1),
        new Color("LIGHT_GRAY2", Colors.LIGHT_GRAY2),
        new Color("LIGHT_GRAY3", Colors.LIGHT_GRAY3),
        new Color("LIGHT_GRAY4", Colors.LIGHT_GRAY4),
        new Color("LIGHT_GRAY5", Colors.LIGHT_GRAY5)
      );
    case PaletteName.White:
    case "White":
      return new Palette(
        name,
        PaletteType.Achromatic,
        PaletteScheme.Sequential,
        new Color("WHITE", Colors.WHITE),
        new Color("LIGHT_GRAY3", Colors.LIGHT_GRAY3),
        new Color("GRAY3", Colors.GRAY3),
        new Color("DARK_GRAY3", Colors.DARK_GRAY3),
        new Color("BLACK", Colors.BLACK)
      );
    case PaletteName.Vermilion:
    case "Vermilion":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("VERMILION1", Colors.VERMILION1),
        new Color("VERMILION2", Colors.VERMILION2),
        new Color("VERMILION3", Colors.VERMILION3),
        new Color("VERMILION4", Colors.VERMILION4),
        new Color("VERMILION5", Colors.VERMILION5)
      );
    case PaletteName.Rose:
    case "Rose":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("ROSE1", Colors.ROSE1),
        new Color("ROSE2", Colors.ROSE2),
        new Color("ROSE3", Colors.ROSE3),
        new Color("ROSE4", Colors.ROSE4),
        new Color("ROSE5", Colors.ROSE5)
      );
    case PaletteName.Violet:
    case "Violet":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("VIOLET1", Colors.VIOLET1),
        new Color("VIOLET2", Colors.VIOLET2),
        new Color("VIOLET3", Colors.VIOLET3),
        new Color("VIOLET4", Colors.VIOLET4),
        new Color("VIOLET5", Colors.VIOLET5)
      );
    case PaletteName.Indigo:
    case "Indigo":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("INDIGO1", Colors.INDIGO1),
        new Color("INDIGO2", Colors.INDIGO2),
        new Color("INDIGO3", Colors.INDIGO3),
        new Color("INDIGO4", Colors.INDIGO4),
        new Color("INDIGO5", Colors.INDIGO5)
      );
    case PaletteName.Cerulean:
    case "Cerulean":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("CERULEAN1", Colors.CERULEAN1),
        new Color("CERULEAN2", Colors.CERULEAN2),
        new Color("CERULEAN3", Colors.CERULEAN3),
        new Color("CERULEAN4", Colors.CERULEAN4),
        new Color("CERULEAN5", Colors.CERULEAN5)
      );
    case PaletteName.Turquoise:
    case "Turquoise":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("TURQUOISE1", Colors.TURQUOISE1),
        new Color("TURQUOISE2", Colors.TURQUOISE2),
        new Color("TURQUOISE3", Colors.TURQUOISE3),
        new Color("TURQUOISE4", Colors.TURQUOISE4),
        new Color("TURQUOISE5", Colors.TURQUOISE5)
      );
    case PaletteName.Forest:
    case "Forest":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("FOREST1", Colors.FOREST1),
        new Color("FOREST2", Colors.FOREST2),
        new Color("FOREST3", Colors.FOREST3),
        new Color("FOREST4", Colors.FOREST4),
        new Color("FOREST5", Colors.FOREST5)
      );
    case PaletteName.Lime:
    case "Lime":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("LIME1", Colors.LIME1),
        new Color("LIME2", Colors.LIME2),
        new Color("LIME3", Colors.LIME3),
        new Color("LIME4", Colors.LIME4),
        new Color("LIME5", Colors.LIME5)
      );
    case PaletteName.Gold:
    case "Gold":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("GOLD1", Colors.GOLD1),
        new Color("GOLD2", Colors.GOLD2),
        new Color("GOLD3", Colors.GOLD3),
        new Color("GOLD4", Colors.GOLD4),
        new Color("GOLD5", Colors.GOLD5)
      );
    case PaletteName.Sepia:
    case "Sepia":
      return new Palette(
        name,
        PaletteType.Extended,
        PaletteScheme.Sequential,
        new Color("SEPIA1", Colors.SEPIA1),
        new Color("SEPIA2", Colors.SEPIA2),
        new Color("SEPIA3", Colors.SEPIA3),
        new Color("SEPIA4", Colors.SEPIA4),
        new Color("SEPIA5", Colors.SEPIA5)
      );
    case PaletteName.Blue:
    case "Blue":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("BLUE1", Colors.BLUE1),
        new Color("BLUE2", Colors.BLUE2),
        new Color("BLUE3", Colors.BLUE3),
        new Color("BLUE4", Colors.BLUE4),
        new Color("BLUE5", Colors.BLUE5)
      );
    case PaletteName.Green:
    case "Green":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("GREEN1", Colors.GREEN1),
        new Color("GREEN2", Colors.GREEN2),
        new Color("GREEN3", Colors.GREEN3),
        new Color("GREEN4", Colors.GREEN4),
        new Color("GREEN5", Colors.GREEN5)
      );
    case PaletteName.Orange:
    case "Orange":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("ORANGE1", Colors.ORANGE1),
        new Color("ORANGE2", Colors.ORANGE2),
        new Color("ORANGE3", Colors.ORANGE3),
        new Color("ORANGE4", Colors.ORANGE4),
        new Color("ORANGE5", Colors.ORANGE5)
      );
    case PaletteName.Red:
    case "Red":
      return new Palette(
        name,
        PaletteType.Core,
        PaletteScheme.Sequential,
        new Color("RED1", Colors.RED1),
        new Color("RED2", Colors.RED2),
        new Color("RED3", Colors.RED3),
        new Color("RED4", Colors.RED4),
        new Color("RED5", Colors.RED5)
      );
    default:
      throw new Error(`Unknown palette name: ${name}`);
  }
});
const customPalettes = json.palettes.map((palette) => Palette.build(palette));

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
        palette.scheme
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
        allPalettes.filter((palette) => typeFilter(options, palette) && schemeFilter(options, palette))
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
        this.palettes.filter((palette) => typeFilter(options, palette) && schemeFilter(options, palette))
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
