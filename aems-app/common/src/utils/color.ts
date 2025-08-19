import { typeofNumber, typeofString } from "./util";

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

const wordToHex = {
  aliceblue: "#f0f8ff" as `#${string}`,
  antiquewhite: "#faebd7" as `#${string}`,
  aqua: "#00ffff" as `#${string}`,
  aquamarine: "#7fffd4" as `#${string}`,
  azure: "#f0ffff" as `#${string}`,
  beige: "#f5f5dc" as `#${string}`,
  bisque: "#ffe4c4" as `#${string}`,
  black: "#000000" as `#${string}`,
  blanchedalmond: "#ffebcd" as `#${string}`,
  blue: "#0000ff" as `#${string}`,
  blueviolet: "#8a2be2" as `#${string}`,
  brown: "#a52a2a" as `#${string}`,
  burlywood: "#deb887" as `#${string}`,
  cadetblue: "#5f9ea0" as `#${string}`,
  chartreuse: "#7fff00" as `#${string}`,
  chocolate: "#d2691e" as `#${string}`,
  coral: "#ff7f50" as `#${string}`,
  cornflowerblue: "#6495ed" as `#${string}`,
  cornsilk: "#fff8dc" as `#${string}`,
  crimson: "#dc143c" as `#${string}`,
  cyan: "#00ffff" as `#${string}`,
  darkblue: "#00008b" as `#${string}`,
  darkcyan: "#008b8b" as `#${string}`,
  darkgoldenrod: "#b8860b" as `#${string}`,
  darkgray: "#a9a9a9" as `#${string}`,
  darkgrey: "#a9a9a9" as `#${string}`,
  darkgreen: "#006400" as `#${string}`,
  darkkhaki: "#bdb76b" as `#${string}`,
  darkmagenta: "#8b008b" as `#${string}`,
  darkolivegreen: "#556b2f" as `#${string}`,
  darkorange: "#ff8c00" as `#${string}`,
  darkorchid: "#9932cc" as `#${string}`,
  darkred: "#8b0000" as `#${string}`,
  darksalmon: "#e9967a" as `#${string}`,
  darkseagreen: "#8fbc8f" as `#${string}`,
  darkslateblue: "#483d8b" as `#${string}`,
  darkslategray: "#2f4f4f" as `#${string}`,
  darkslategrey: "#2f4f4f" as `#${string}`,
  darkturquoise: "#00ced1" as `#${string}`,
  darkviolet: "#9400d3" as `#${string}`,
  deeppink: "#ff1493" as `#${string}`,
  deepskyblue: "#00bfff" as `#${string}`,
  dimgray: "#696969" as `#${string}`,
  dimgrey: "#696969" as `#${string}`,
  dodgerblue: "#1e90ff" as `#${string}`,
  firebrick: "#b22222" as `#${string}`,
  floralwhite: "#fffaf0" as `#${string}`,
  forestgreen: "#228b22" as `#${string}`,
  fuchsia: "#ff00ff" as `#${string}`,
  gainsboro: "#dcdcdc" as `#${string}`,
  ghostwhite: "#f8f8ff" as `#${string}`,
  gold: "#ffd700" as `#${string}`,
  goldenrod: "#daa520" as `#${string}`,
  gray: "#808080" as `#${string}`,
  grey: "#808080" as `#${string}`,
  green: "#008000" as `#${string}`,
  greenyellow: "#adff2f" as `#${string}`,
  honeydew: "#f0fff0" as `#${string}`,
  hotpink: "#ff69b4" as `#${string}`,
  indianred: "#cd5c5c" as `#${string}`,
  indigo: "#4b0082" as `#${string}`,
  ivory: "#fffff0" as `#${string}`,
  khaki: "#f0e68c" as `#${string}`,
  lavender: "#e6e6fa" as `#${string}`,
  lavenderblush: "#fff0f5" as `#${string}`,
  lawngreen: "#7cfc00" as `#${string}`,
  lemonchiffon: "#fffacd" as `#${string}`,
  lightblue: "#add8e6" as `#${string}`,
  lightcoral: "#f08080" as `#${string}`,
  lightcyan: "#e0ffff" as `#${string}`,
  lightgoldenrodyellow: "#fafad2" as `#${string}`,
  lightgray: "#d3d3d3" as `#${string}`,
  lightgrey: "#d3d3d3" as `#${string}`,
  lightgreen: "#90ee90" as `#${string}`,
  lightpink: "#ffb6c1" as `#${string}`,
  lightsalmon: "#ffa07a" as `#${string}`,
  lightseagreen: "#20b2aa" as `#${string}`,
  lightskyblue: "#87cefa" as `#${string}`,
  lightslategray: "#778899" as `#${string}`,
  lightslategrey: "#778899" as `#${string}`,
  lightsteelblue: "#b0c4de" as `#${string}`,
  lightyellow: "#ffffe0" as `#${string}`,
  lime: "#00ff00" as `#${string}`,
  limegreen: "#32cd32" as `#${string}`,
  linen: "#faf0e6" as `#${string}`,
  magenta: "#ff00ff" as `#${string}`,
  maroon: "#800000" as `#${string}`,
  mediumaquamarine: "#66cdaa" as `#${string}`,
  mediumblue: "#0000cd" as `#${string}`,
  mediumorchid: "#ba55d3" as `#${string}`,
  mediumpurple: "#9370db" as `#${string}`,
  mediumseagreen: "#3cb371" as `#${string}`,
  mediumslateblue: "#7b68ee" as `#${string}`,
  mediumspringgreen: "#00fa9a" as `#${string}`,
  mediumturquoise: "#48d1cc" as `#${string}`,
  mediumvioletred: "#c71585" as `#${string}`,
  midnightblue: "#191970" as `#${string}`,
  mintcream: "#f5fffa" as `#${string}`,
  mistyrose: "#ffe4e1" as `#${string}`,
  moccasin: "#ffe4b5" as `#${string}`,
  navajowhite: "#ffdead" as `#${string}`,
  navy: "#000080" as `#${string}`,
  oldlace: "#fdf5e6" as `#${string}`,
  olive: "#808000" as `#${string}`,
  olivedrab: "#6b8e23" as `#${string}`,
  orange: "#ffa500" as `#${string}`,
  orangered: "#ff4500" as `#${string}`,
  orchid: "#da70d6" as `#${string}`,
  palegoldenrod: "#eee8aa" as `#${string}`,
  palegreen: "#98fb98" as `#${string}`,
  paleturquoise: "#afeeee" as `#${string}`,
  palevioletred: "#db7093" as `#${string}`,
  papayawhip: "#ffefd5" as `#${string}`,
  peachpuff: "#ffdab9" as `#${string}`,
  peru: "#cd853f" as `#${string}`,
  pink: "#ffc0cb" as `#${string}`,
  plum: "#dda0dd" as `#${string}`,
  powderblue: "#b0e0e6" as `#${string}`,
  purple: "#800080" as `#${string}`,
  rebeccapurple: "#663399" as `#${string}`,
  red: "#ff0000" as `#${string}`,
  rosybrown: "#bc8f8f" as `#${string}`,
  royalblue: "#4169e1" as `#${string}`,
  saddlebrown: "#8b4513" as `#${string}`,
  salmon: "#fa8072" as `#${string}`,
  sandybrown: "#f4a460" as `#${string}`,
  seagreen: "#2e8b57" as `#${string}`,
  seashell: "#fff5ee" as `#${string}`,
  sienna: "#a0522d" as `#${string}`,
  silver: "#c0c0c0" as `#${string}`,
  skyblue: "#87ceeb" as `#${string}`,
  slateblue: "#6a5acd" as `#${string}`,
  slategray: "#708090" as `#${string}`,
  slategrey: "#708090" as `#${string}`,
  snow: "#fffafa" as `#${string}`,
  springgreen: "#00ff7f" as `#${string}`,
  steelblue: "#4682b4" as `#${string}`,
  tan: "#d2b48c" as `#${string}`,
  teal: "#008080" as `#${string}`,
  thistle: "#d8bfd8" as `#${string}`,
  tomato: "#ff6347" as `#${string}`,
  turquoise: "#40e0d0" as `#${string}`,
  violet: "#ee82ee" as `#${string}`,
  wheat: "#f5deb3" as `#${string}`,
  white: "#ffffff" as `#${string}`,
  whitesmoke: "#f5f5f5" as `#${string}`,
  yellow: "#ffff00" as `#${string}`,
  yellowgreen: "#9acd32" as `#${string}`,
};

const hexToWord = Object.fromEntries(Object.entries(wordToHex).map(([k, v]) => [v, k]));

const toHex = (color: string) => {
  const c = color.toLocaleLowerCase();
  return typeofColor(c) ? wordToHex[c] : undefined;
};
const fromHex = (hex: `#${string}`): string => hexToWord[hex.toLowerCase()];
const hsl2rgb = (h: number, s: number, l: number) => {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  return [f(0), f(8), f(4)];
};

export function typeofColor(value: string | number): value is keyof typeof wordToHex {
  return typeofString(value) && Object.prototype.hasOwnProperty.call(wordToHex, value.toLowerCase());
}
export function typeofHex(value: string | number): value is `#${string}` {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6,8}$/.test(value);
}
function throwError(message: string): never {
  throw new Error(message);
}

/**
 * JSON representation of a color.
 */
export interface JsonColor {
  name: string;
  hex: `#${string}`;
}

export class Color {
  readonly name: string;
  readonly hex: `#${string}`;

  constructor(color: keyof typeof wordToHex);
  constructor(name: string, color: keyof typeof wordToHex);
  constructor(hex: `#${string}`);
  constructor(name: string, hex: `#${string}`);
  constructor(red: number, green: number, blue: number);
  constructor(red: number, green: number, blue: number, alpha: number);
  constructor(name: string, red: number, green: number, blue: number);
  constructor(name: string, red: number, green: number, blue: number, alpha: number);
  constructor(...values: (string | number)[]) {
    let name = "";
    let hex = "";
    if (values.length === 1 && typeofHex(values[0])) {
      hex = values[0];
    } else if (values.length === 1 && typeofColor(values[0])) {
      hex = toHex(values[0]) ?? "";
    } else if (values.length === 2 && typeofString(values[0]) && typeofHex(values[1])) {
      name = values[0];
      hex = values[1];
    } else if (values.length === 2 && typeofString(values[0]) && typeofColor(values[1])) {
      name = values[0];
      hex = toHex(values[1]) ?? "";
    } else if (values.every((value) => typeof value === "number")) {
      name = "";
      hex = `#${values
        .map((value, i) => (i === 3 ? Math.round(value * 255) : value).toString(16).padStart(2, "0"))
        .join("")}`;
    } else if (
      (values.length === 4 || values.length === 5) &&
      typeofString(values[0]) &&
      values.slice(1).every((value) => typeof value === "number")
    ) {
      name = values[0];
      hex = `#${values
        .slice(1)
        .filter(typeofNumber)
        .map((value, i) => (i === 3 ? Math.round(value * 255) : value).toString(16).padStart(2, "0"))
        .join("")}`;
    } else {
      throwError("Invalid color values");
    }
    this.name = typeofString(name) ? name : throwError(`Invalid color name: ${name as any}`);
    this.hex = typeofHex(hex)
      ? (hex.toLocaleLowerCase() as `#${string}`)
      : throwError(`Invalid color hex: ${hex as any}`);
  }

  static build(builder: JsonColor): Color {
    return new Color(builder.name, builder.hex);
  }

  static parse(value: string): Color;
  static parse(name: string, value: string): Color;
  static parse(first: string, second?: string): Color {
    const name = typeofString(second) ? first : "";
    const value = typeofString(second) ? second : first;
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
    } else if (typeofHex(value)) {
      return new Color(name, value);
    } else {
      throwError("Invalid color values");
    }
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

  toString(type: ColorType.Hex | ColorType.HexA): `#${string}`;
  toString(type: ColorType.Color): keyof typeof wordToHex | `#${string}`;
  toString(type: ColorType.RGB | ColorType.RGBA | ColorType.HSL | ColorType.HSLA): string;
  toString(): `#${string}`;
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
        return fromHex(this.hex) ?? this.hex;
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
 * ANSI style codes for console output
 */
const STYLES = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",
} as const;

/**
 * ANSI foreground color codes for console output (3-bit/4-bit colors)
 */
const COLORS = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
} as const;

/**
 * ANSI bright foreground color codes (4-bit colors)
 */
const BRIGHT_COLORS = {
  brightBlack: "\x1b[90m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  brightWhite: "\x1b[97m",
} as const;

/**
 * ANSI background color codes for console output (3-bit/4-bit colors)
 */
const BACKGROUNDS = {
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
} as const;

/**
 * ANSI bright background color codes (4-bit colors)
 */
const BRIGHT_BACKGROUNDS = {
  bgBrightBlack: "\x1b[100m",
  bgBrightRed: "\x1b[101m",
  bgBrightGreen: "\x1b[102m",
  bgBrightYellow: "\x1b[103m",
  bgBrightBlue: "\x1b[104m",
  bgBrightMagenta: "\x1b[105m",
  bgBrightCyan: "\x1b[106m",
  bgBrightWhite: "\x1b[107m",
} as const;

/**
 * Combined color maps for easier lookup
 */
const ALL_COLORS = { ...COLORS, ...BRIGHT_COLORS } as const;
const ALL_BACKGROUNDS = { ...BACKGROUNDS, ...BRIGHT_BACKGROUNDS } as const;

/**
 * RGB color interface
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Valid style names that can be used with the colorize function
 */
export type StyleName = keyof typeof STYLES;

/**
 * Valid 3-bit color names
 */
export type ColorName = keyof typeof COLORS;

/**
 * Valid 4-bit bright color names
 */
export type BrightColorName = keyof typeof BRIGHT_COLORS;

/**
 * Valid 3-bit background names
 */
export type BackgroundName = keyof typeof BACKGROUNDS;

/**
 * Valid 4-bit bright background names
 */
export type BrightBackgroundName = keyof typeof BRIGHT_BACKGROUNDS;

/**
 * All valid color names (3-bit and 4-bit)
 */
export type AllColorName = ColorName | BrightColorName;

/**
 * All valid background names (3-bit and 4-bit)
 */
export type AllBackgroundName = BackgroundName | BrightBackgroundName;

/**
 * Color input type - can be a named color, RGB values, or hex string
 */
export type ColorInput = AllColorName | RGBColor | `#${string}`;

/**
 * Background input type - can be a named background, RGB values, or hex string
 */
export type BackgroundInput = AllBackgroundName | RGBColor | `#${string}`;

/**
 * Valid format names that can be used with the colorize function
 */
export type FormatName = StyleName | AllColorName | AllBackgroundName;

/**
 * Utility function to convert RGB values to ANSI 24-bit color code
 */
function rgbToAnsi(r: number, g: number, b: number, isBackground = false): string {
  // Clamp values to 0-255 range
  r = Math.max(0, Math.min(255, Math.round(r)));
  g = Math.max(0, Math.min(255, Math.round(g)));
  b = Math.max(0, Math.min(255, Math.round(b)));

  const prefix = isBackground ? "48" : "38";
  return `\x1b[${prefix};2;${r};${g};${b}m`;
}

/**
 * Utility function to parse hex color string to RGB
 */
function hexToRgb(hex: string): RGBColor | null {
  // Remove # if present
  hex = hex.replace("#", "");

  // Support both 3-digit and 6-digit hex
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  if (hex.length !== 6) {
    return null;
  }

  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return null;
  }

  return { r, g, b };
}

/**
 * Utility function to get color code from various input types
 */
function getColorCode(color: ColorInput | BackgroundInput, isBackground = false): string {
  // Handle named colors
  if (typeof color === "string") {
    // Check if it's a hex color
    if (color.startsWith("#")) {
      const rgb = hexToRgb(color);
      if (rgb) {
        return rgbToAnsi(rgb.r, rgb.g, rgb.b, isBackground);
      }
      return "";
    }

    // Check in appropriate color maps
    if (isBackground) {
      if (color in ALL_BACKGROUNDS) {
        return ALL_BACKGROUNDS[color as keyof typeof ALL_BACKGROUNDS];
      }
    } else {
      if (color in ALL_COLORS) {
        return ALL_COLORS[color as keyof typeof ALL_COLORS];
      }
    }

    return "";
  }

  // Handle RGB object
  if (typeof color === "object" && "r" in color && "g" in color && "b" in color) {
    return rgbToAnsi(color.r, color.g, color.b, isBackground);
  }

  return "";
}

/**
 * Applies multiple formatting options to text (3-bit colors, style, and background)
 *
 * @param text - The text to format
 * @param options - Object containing optional color, style, and background
 * @returns The formatted text string with ANSI escape codes
 *
 * @example
 * ```typescript
 * console.log(format('Important Message', { color: 'red', style: 'bright', background: 'bgYellow' }));
 * console.log(format('Success!', { color: 'green', style: 'bright' }));
 * console.log(format('RGB Message', { color: { r: 255, g: 0, b: 0 }, style: 'bright', background: '#ffff00' }));
 * console.log(format('Bright Colors', { color: 'brightGreen', background: 'bgBrightBlue' }));
 * ```
 */
export function colorize(
  text: string,
  options: {
    color?: ColorInput;
    style?: StyleName;
    background?: BackgroundInput;
  },
): string {
  let formattedText = text;
  let codes = "";

  if (options.background) {
    codes += getColorCode(options.background, true);
  }

  if (options.color) {
    codes += getColorCode(options.color, false);
  }

  if (options.style && options.style !== "reset") {
    codes += STYLES[options.style];
  }

  if (codes) {
    formattedText = `${codes}${text}${STYLES.reset}`;
  }

  return formattedText;
}
