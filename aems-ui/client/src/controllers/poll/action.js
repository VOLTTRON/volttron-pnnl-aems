export const key = "poll";

/**
 * The poll interval defined in the env file.
 */
export const defaultPollInterval = process.env.REACT_APP_POLLING ? parseInt(process.env.REACT_APP_POLLING) : undefined;

/**
 * A poll interval for items that need to be updated regularly.
 */
export const fastPollInterval = defaultPollInterval ? Math.ceil(defaultPollInterval / 10) : defaultPollInterval;

/**
 * A poll interval for items that don't need to be updated regularly.
 */
export const slowPollInterval = defaultPollInterval ? Math.ceil(defaultPollInterval * 10) : defaultPollInterval;
