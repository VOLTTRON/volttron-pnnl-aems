/**
 * Utility functions for optimizing system names in charts
 * Handles dynamic abbreviation, truncation, and margin calculation
 */

interface OptimizedSystemNames {
  displayNames: string[];
  leftMargin: number;
}

/**
 * Configuration constants for system name optimization
 */
const CONFIG = {
  MIN_LEFT_MARGIN: 40,
  MAX_LEFT_MARGIN: 140,
  TARGET_LENGTH: 10, // Optimal length for minimum margin
  CHARS_PER_PIXEL: 7, // Approximate character width in pixels
  ELLIPSIS: "...",
};

/**
 * Find the longest common prefix among all system names (word-boundary aware)
 * Returns the prefix up to the last common delimiter (-, _, etc.)
 */
function findCommonPrefix(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return "";

  // Find character-by-character common prefix
  let prefix = "";
  const firstWord = names[0];

  for (let i = 0; i < firstWord.length; i++) {
    const char = firstWord[i];
    if (names.every((name) => name[i] === char)) {
      prefix += char;
    } else {
      break;
    }
  }

  // Trim to last word boundary (delimiter like -, _, .)
  const lastDelimiter = Math.max(prefix.lastIndexOf("-"), prefix.lastIndexOf("_"), prefix.lastIndexOf("."));

  if (lastDelimiter > 0) {
    return prefix.substring(0, lastDelimiter + 1); // Include the delimiter
  }

  return "";
}

/**
 * Replace common prefix with asterisk (*) in all names
 */
function replaceCommonPrefix(names: string[], prefix: string): string[] {
  if (!prefix) return names;
  return names.map((name) => {
    if (name.startsWith(prefix)) {
      return "*" + name.substring(prefix.length);
    }
    return name;
  });
}

/**
 * Truncate a name from the left, keeping the rightmost (most specific) parts
 */
function truncateFromLeft(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;

  const ellipsisLength = CONFIG.ELLIPSIS.length;
  const keepLength = maxLength - ellipsisLength;

  if (keepLength <= 0) return CONFIG.ELLIPSIS;

  return CONFIG.ELLIPSIS + name.slice(-keepLength);
}

/**
 * Calculate the optimal left margin based on the maximum name length
 */
function calculateLeftMargin(maxLength: number): number {
  const calculatedMargin = maxLength * CONFIG.CHARS_PER_PIXEL;
  return Math.min(CONFIG.MAX_LEFT_MARGIN, Math.max(CONFIG.MIN_LEFT_MARGIN, calculatedMargin));
}

/**
 * Main function: Optimize system names for display
 * 
 * Algorithm:
 * 1. If all names ≤ 10 chars: return as-is (no processing)
 * 2. If names > 10 chars: try removing common prefix (replace with *)
 * 3. If still > 10 chars: truncate from left (keep right/specific parts)
 * 4. Calculate dynamic left margin (40-140px) based on final length
 */
export function optimizeSystemNames(names: string[]): OptimizedSystemNames {
  if (names.length === 0) {
    return { displayNames: [], leftMargin: CONFIG.MIN_LEFT_MARGIN };
  }

  // STEP 0: Early exit - if all names are already short enough
  const maxOriginalLen = Math.max(...names.map((n) => n.length));
  if (maxOriginalLen <= CONFIG.TARGET_LENGTH) {
    const leftMargin = calculateLeftMargin(maxOriginalLen);
    return { displayNames: names, leftMargin };
  }

  // STEP 1: Try removing common prefix (replace with *)
  const commonPrefix = findCommonPrefix(names);
  let displayNames = replaceCommonPrefix(names, commonPrefix);

  // STEP 2: Check if prefix removal was enough
  const maxAfterPrefix = Math.max(...displayNames.map((n) => n.length));
  if (maxAfterPrefix <= CONFIG.TARGET_LENGTH) {
    const leftMargin = calculateLeftMargin(maxAfterPrefix);
    return { displayNames, leftMargin };
  }

  // STEP 3: Still too long - truncate from left (keep right/specific parts)
  displayNames = displayNames.map((name) => truncateFromLeft(name, CONFIG.TARGET_LENGTH));

  // STEP 4: Calculate final margin
  const finalMaxLen = Math.max(...displayNames.map((n) => n.length));
  const leftMargin = calculateLeftMargin(finalMaxLen);

  return { displayNames, leftMargin };
}
