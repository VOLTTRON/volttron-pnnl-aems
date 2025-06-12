import { printEnvironment } from "@local/common";

// This function is called by Nextjs
// https://nextjs.org/docs/pages/building-your-application/optimizing/instrumentation

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    process.setMaxListeners(100);
    process.on("warning", (e) => console.warn(`Process warning: ${e.message}\n`, e.stack));
    printEnvironment();
  }
}
