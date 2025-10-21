"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Color = exports.ColorType = void 0;
exports.typeofColor = typeofColor;
exports.typeofHex = typeofHex;
exports.colorize = colorize;
const util_1 = require("./util");
var ColorType;
(function (ColorType) {
    ColorType["Color"] = "Color";
    ColorType["Hex"] = "Hex";
    ColorType["HexA"] = "HexA";
    ColorType["RGB"] = "RGB";
    ColorType["RGBA"] = "RGBA";
    ColorType["HSL"] = "HSL";
    ColorType["HSLA"] = "HSLA";
})(ColorType || (exports.ColorType = ColorType = {}));
const wordToHex = {
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
const toHex = (color) => {
    const c = color.toLocaleLowerCase();
    return typeofColor(c) ? wordToHex[c] : undefined;
};
const fromHex = (hex) => hexToWord[hex.toLowerCase()];
const hsl2rgb = (h, s, l) => {
    const a = s * Math.min(l, 1 - l);
    const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return [f(0), f(8), f(4)];
};
function typeofColor(value) {
    return (0, util_1.typeofString)(value) && Object.prototype.hasOwnProperty.call(wordToHex, value.toLowerCase());
}
function typeofHex(value) {
    return typeof value === "string" && /^#[0-9A-Fa-f]{6,8}$/.test(value);
}
function throwError(message) {
    throw new Error(message);
}
class Color {
    constructor(...values) {
        let name = "";
        let hex = "";
        if (values.length === 1 && typeofHex(values[0])) {
            hex = values[0];
        }
        else if (values.length === 1 && typeofColor(values[0])) {
            hex = toHex(values[0]) ?? "";
        }
        else if (values.length === 2 && (0, util_1.typeofString)(values[0]) && typeofHex(values[1])) {
            name = values[0];
            hex = values[1];
        }
        else if (values.length === 2 && (0, util_1.typeofString)(values[0]) && typeofColor(values[1])) {
            name = values[0];
            hex = toHex(values[1]) ?? "";
        }
        else if (values.every((value) => typeof value === "number")) {
            name = "";
            hex = `#${values
                .map((value, i) => (i === 3 ? Math.round(value * 255) : value).toString(16).padStart(2, "0"))
                .join("")}`;
        }
        else if ((values.length === 4 || values.length === 5) &&
            (0, util_1.typeofString)(values[0]) &&
            values.slice(1).every((value) => typeof value === "number")) {
            name = values[0];
            hex = `#${values
                .slice(1)
                .filter(util_1.typeofNumber)
                .map((value, i) => (i === 3 ? Math.round(value * 255) : value).toString(16).padStart(2, "0"))
                .join("")}`;
        }
        else {
            throwError("Invalid color values");
        }
        this.name = (0, util_1.typeofString)(name) ? name : throwError(`Invalid color name: ${name}`);
        this.hex = typeofHex(hex)
            ? hex.toLocaleLowerCase()
            : throwError(`Invalid color hex: ${hex}`);
    }
    static build(builder) {
        return new Color(builder.name, builder.hex);
    }
    static parse(first, second) {
        const name = (0, util_1.typeofString)(second) ? first : "";
        const value = (0, util_1.typeofString)(second) ? second : first;
        if (/rgb\(\d{1,3}, ?\d{1,3}, ?\d{1,3}\)/.test(value)) {
            const [, r, g, b] = /rgb\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)/.exec(value) ?? [];
            return new Color(parseInt(r), parseInt(g), parseInt(b));
        }
        else if (/rgba\(\d{1,3}, ?\d{1,3}, ?\d{1,3}, ?0?\.\d+\)/.test(value)) {
            const [, r, g, b, a] = /rgba\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3}), ?(0?\.\d+)\)/.exec(value) ?? [];
            return new Color(parseInt(r), parseInt(g), parseInt(b), parseFloat(a));
        }
        else if (/hsl\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%\)/.test(value)) {
            const [, h, s, l] = /hsl\((\d{1,3}), ?(\d{1,3})%, ?(\d{1,3})%\)/.exec(value) ?? [];
            const [r, g, b] = hsl2rgb(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
            return new Color(r * 255, g * 255, b * 255);
        }
        else if (/hsla\(\d{1,3}, ?\d{1,3}%, ?\d{1,3}%, ?0?\.\d+\)/.test(value)) {
            const [, h, s, l, a] = /hsla\((\d{1,3}), ?(\d{1,3})%, ?(\d{1,3})%, ?(0?\.\d+)\)/.exec(value) ?? [];
            const [r, g, b] = hsl2rgb(parseInt(h), parseInt(s) / 100, parseInt(l) / 100);
            return new Color(r * 255, g * 255, b * 255, parseFloat(a));
        }
        else if (typeofHex(value)) {
            return new Color(name, value);
        }
        else {
            throwError("Invalid color values");
        }
    }
    get red() {
        return parseInt(this.hex.slice(1, 3), 16);
    }
    get green() {
        return parseInt(this.hex.slice(3, 5), 16);
    }
    get blue() {
        return parseInt(this.hex.slice(5, 7), 16);
    }
    get alpha() {
        return this.hex.length === 9 ? Math.round((parseInt(this.hex.slice(7, 9), 16) / 255) * 100) / 100 : 1;
    }
    get rgb() {
        return `rgb(${this.red}, ${this.green}, ${this.blue})`;
    }
    get rgba() {
        return `rgba(${this.red}, ${this.green}, ${this.blue}, ${this.alpha})`;
    }
    get hsl() {
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
    get hsla() {
        return this.hsl.replace("hsl", "hsla").replace(")", `, ${this.alpha})`);
    }
    toString(type) {
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
    valueOf() {
        return this.hex;
    }
    [Symbol.toPrimitive](hint) {
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
exports.Color = Color;
const STYLES = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",
};
const COLORS = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
};
const BRIGHT_COLORS = {
    brightBlack: "\x1b[90m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",
};
const BACKGROUNDS = {
    bgBlack: "\x1b[40m",
    bgRed: "\x1b[41m",
    bgGreen: "\x1b[42m",
    bgYellow: "\x1b[43m",
    bgBlue: "\x1b[44m",
    bgMagenta: "\x1b[45m",
    bgCyan: "\x1b[46m",
    bgWhite: "\x1b[47m",
};
const BRIGHT_BACKGROUNDS = {
    bgBrightBlack: "\x1b[100m",
    bgBrightRed: "\x1b[101m",
    bgBrightGreen: "\x1b[102m",
    bgBrightYellow: "\x1b[103m",
    bgBrightBlue: "\x1b[104m",
    bgBrightMagenta: "\x1b[105m",
    bgBrightCyan: "\x1b[106m",
    bgBrightWhite: "\x1b[107m",
};
const ALL_COLORS = { ...COLORS, ...BRIGHT_COLORS };
const ALL_BACKGROUNDS = { ...BACKGROUNDS, ...BRIGHT_BACKGROUNDS };
function rgbToAnsi(r, g, b, isBackground = false) {
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    const prefix = isBackground ? "48" : "38";
    return `\x1b[${prefix};2;${r};${g};${b}m`;
}
function hexToRgb(hex) {
    hex = hex.replace("#", "");
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
function getColorCode(color, isBackground = false) {
    if (typeof color === "string") {
        if (color.startsWith("#")) {
            const rgb = hexToRgb(color);
            if (rgb) {
                return rgbToAnsi(rgb.r, rgb.g, rgb.b, isBackground);
            }
            return "";
        }
        if (isBackground) {
            if (color in ALL_BACKGROUNDS) {
                return ALL_BACKGROUNDS[color];
            }
        }
        else {
            if (color in ALL_COLORS) {
                return ALL_COLORS[color];
            }
        }
        return "";
    }
    if (typeof color === "object" && "r" in color && "g" in color && "b" in color) {
        return rgbToAnsi(color.r, color.g, color.b, isBackground);
    }
    return "";
}
function colorize(text, options) {
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
//# sourceMappingURL=color.js.map