import { isNumber, isString } from "lodash";

/**
 * Create an RGBA color with the specified opacity.
 *
 * @param {String} color hex rgb or argb
 * @param {Number} alpha 0.0 to 1.0
 */
export const opacity = (color: string, alpha: number) => {
  const a = Math.floor(alpha * 255.0).toString(16);
  const [, m] = color.match(/^(?:#|0x)(?:[a-f0-9]{2})?([a-f0-9]{6})$/i) || [];
  if (!m) {
    throw new Error(`Color is not a valid hex rgb or argb value: ${color}`);
  }
  const rgb = m.toLocaleLowerCase();
  return `#${a}${rgb}`;
};

// font weights
export const normal = "400";
export const bold = "700";
export const medium = "550";

// states
export const active = "#5786CD"; // bright primary
export const disabled = "#d8d8d8";

// grays
export const white = "#FFFFFF";
export const lightest = "#F5F5F5";
export const lighter = "#D3D3D3";
export const light = "#A9A9A9";
export const gray = "#A6A6A6";
export const dark = "#585858";
export const darker = "#434343";
export const darkest = "#181818";
export const black = "#000000";

// colors
export const background = "#EFEFEF";
export const backgroundShade = "#EFEFEF";
export const primary = "#1C4DAE"; // primary color
export const primaryTint = "#1D4EB0"; // light primary
export const primaryShade = "#0B2B69"; // dark primary
export const secondary = "#5786CD"; // bright primary
export const attention = "#5786CD"; // blue

// status
export const info = "#ffb73e"; // yellow
export const infoTint = "#ffcd79"; // light yellow
export const infoDisabled = "#B9AD98"; // disabled yellow
export const warning = "#f15c3e"; // orange
export const warningTint = "#f58a75"; // light orange
export const warningDisabled = "#BA9D98"; // disabled orange
export const error = "#be0f34"; // red
export const errorTint = "#f15173"; // light red
export const errorDisabled = "#AF9198"; // disabled red

// conditions
export const verified = "#01c353"; // green
export const verifiedTint = "#66db97"; // light green
export const verifiedDisabled = "#92AF9E"; // disabled green
export const selected = "#7794ce"; // blue
export const selectedTint = "#bbcae7"; // light blue
export const selectedDisabled = "#e8edf7"; // disabled blue

/**
 * Use the supplied value to derive a color representation.
 * This is not a traditional color parsing method.
 * This method is to convert values like percentage, error names, etc to a color.
 * Numbers should be on a scale of 0 to 100. Strings should be a text representation.
 *
 * @param {Number|String} value
 */
export const deriveColor = (value: string | number) => {
  if (isNumber(value)) {
    if (value > 90) {
      return error;
    } else if (value > 80) {
      return warning;
    } else if (value > 60) {
      return info;
    } else if (value > 40) {
      return verified;
    } else {
      return gray;
    }
  } else if (isString(value)) {
    const string = value.toLowerCase().replace(/[\s_-]+/, "");
    switch (string) {
      case "extreme":
      case "active":
      case "hot":
      case "donotdistribute":
        return secondary;
      case "high":
      case "error":
      case "severe":
        return error;
      case "medium":
      case "warning":
      case "warn":
      case "moderate":
        return warning;
      case "low":
      case "info":
      case "minimal":
        return info;
      case "normal":
      case "verified":
      case "routine":
      case "good":
        return verified;
      case "select":
      case "selected":
      case "selection":
        return selected;
      case "none":
      default:
        return gray;
    }
  }
};

/////////////////////////////////////////////////////////////
// Charts are the only use case for special color schemes. //
/////////////////////////////////////////////////////////////

export const faults = "#D7191C";
export const inconclusive = "#FDAE61";
export const unitOff = "#ABD9E9";
export const all = "#FFFFFF";
export const likely = "#A9A9A9";
