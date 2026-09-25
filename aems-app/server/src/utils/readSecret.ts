import { Logger } from "@nestjs/common";

const logger = new Logger("readSecret");

/**
 * Reads a secret value from a plain environment variable.
 *
 * @param secretName - The env-var name (e.g., 'SESSION_SECRET')
 * @param defaultValue - Default value when the env var is unset or empty
 */
export function readSecret(secretName: string, defaultValue: string = ""): string {
  const envValue = process.env[secretName];
  if (envValue) {
    return envValue;
  }
  if (process.env.NODE_ENV === "production") {
    logger.warn(
      `No secret found for ${secretName}${defaultValue ? ", using default value" : " and no default provided"}`,
    );
  }
  return defaultValue;
}
