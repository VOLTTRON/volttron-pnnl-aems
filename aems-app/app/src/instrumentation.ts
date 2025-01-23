import { inspect } from "util";

// This function is called by Nextjs
// https://nextjs.org/docs/pages/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.setMaxListeners(100);
    process.on("warning", (e) => console.warn(`Process warning: ${e.message}\n`, e.stack));
    // Log the current environment on startup
    console.log(
      inspect(
        Object.entries(process.env)
          .filter(([k, _v]) => /^[A-Z_]+$/.test(k))
          .map(([k, v]) => `${k}=${/password|secret/i.test(k) ? v?.replace(/./g, "*") : v}`)
      )
    );
    // Start the services task scheduler
    await import("./services/tasks");
  }
}
