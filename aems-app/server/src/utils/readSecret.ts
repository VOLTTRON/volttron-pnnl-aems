import { readFileSync } from "fs";
import { Logger } from "@nestjs/common";

const logger = new Logger("readSecret");

/**
 * Reads a secret value from either a Docker secret file or environment variable.
 * 
 * Priority order:
 * 1. Docker secret file at /run/secrets/<secretName>
 * 2. Environment variable <secretName>_FILE (path to secret file)
 * 3. Environment variable <secretName>
 * 4. Default value (if provided)
 *
 * @param secretName - The base name of the secret (e.g., 'SESSION_SECRET')
 * @param defaultValue - Default value if neither file nor env var is found
 * @returns The secret value
 */
export function readSecret(secretName: string, defaultValue: string = ""): string {
  // Try Docker secrets standard location first
  const dockerSecretPath = `/run/secrets/${secretName.toLowerCase()}`;
  try {
    const secretValue = readFileSync(dockerSecretPath, "utf8").trim();
    if (secretValue) {
      logger.log(`Successfully read secret from Docker secret: ${secretName}`);
      return secretValue;
    }
  } catch (error: any) {
    // File doesn't exist or can't be read, continue to next option
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    logger.warn(`Secret should be specified for production environment: ${secretName}. Attempted to read from ${dockerSecretPath} but failed: ${error.message || String(error)}`);
  }

  // Try _FILE environment variable pattern (e.g., DATABASE_PASSWORD_FILE)
  const fileEnvVar = `${secretName}_FILE`;
  const secretFilePath = process.env[fileEnvVar];
  
  if (secretFilePath) {
    try {
      const secretValue = readFileSync(secretFilePath, "utf8").trim();
      if (secretValue) {
        logger.log(`Successfully read secret from file via ${fileEnvVar}: ${secretFilePath}`);
        return secretValue;
      } else {
        logger.warn(`Secret file is empty: ${secretFilePath}`);
      }
    } catch (error) {
      logger.error(
        `Failed to read secret file ${secretFilePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Fall back to direct environment variable
  const envValue = process.env[secretName];
  if (envValue) {
    logger.log(`Using direct environment variable: ${secretName}`);
    return envValue;
  }

  // Return default value if no source is available
  if (defaultValue) {
    logger.warn(`No secret found for ${secretName}, using default value`);
  } else {
    logger.warn(`No secret found for ${secretName} and no default provided`);
  }

  return defaultValue;
}
