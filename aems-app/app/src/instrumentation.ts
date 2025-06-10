import { inspect } from "util";

// This function is called by Nextjs
// https://nextjs.org/docs/pages/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.setMaxListeners(100);
    process.on("warning", (e) => console.warn(`Process warning: ${e.message}\n`, e.stack));
    // Log the current environment on startup and replace any sensitive values with fixed length asterisks
    console.log(
      inspect(
        Object.entries(process.env)
          .filter(([k, _v]) => /^[A-Z_]+$/.test(k))
          .reduce(
            (a, [k, v]) => ({
              ...a,
              [k]: `${
                /password|secret/i.test(k)
                  ? "********"
                  : /uri|url|path/i.test(k) && /:([^:@]+)@/i.test(v ?? "")
                  ? /^(.*:)([^:@]+)(@.*)$/i
                      .exec(v ?? "")
                      ?.slice(1)
                      .map((v, i) => (i === 1 ? "********" : v))
                      .join("")
                  : v
              }`,
            }),
            {} as Record<string, string>
          ),
        undefined,
        100,
        true
      )
    );
    // Start the services task scheduler
    await import("./services/tasks");
  }
}
