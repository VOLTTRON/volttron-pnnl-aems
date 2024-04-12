const providers = (process.env.NEXTAUTH_PROVIDERS ?? "")
  .split(/[, |]+/)
  .map((v) => v.trim())
  .filter((v) => v.length > 0);
const authenticate = providers.length > 0;

export { providers, authenticate };
