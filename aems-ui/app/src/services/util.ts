import { isEmpty, isEqual, isUndefined, merge, toLower } from "lodash";
import cron from "node-cron";
import { isMainThread, Worker } from "node:worker_threads";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";

import { logger } from "@/logging";
import { ServiceOptions, ServiceState } from "./types";

const schedule = (worker: () => Promise<void>, { schedule, service, leading, type }: ServiceOptions) => {
  const instance = process.env.CLUSTER_TYPE ?? "";
  const types = instance.split(/[, |-]+/).map(toLower);
  const runAll = isEmpty(instance) || isEqual(types, ["services"]);
  const runService = types.includes(toLower(service));
  if (!(runAll || runService)) {
    return;
  }
  const wrapper = (() => {
    let running = false;
    return async () => {
      if (!running) {
        running = true;
        try {
          await worker();
        } catch (error) {
          logger.error(error);
        } finally {
          running = false;
        }
      }
    };
  })();
  const suffix = isEmpty(instance) ? `${type ? type + " " : ""}${service}.` : `${service} for instance ${instance}.`;
  if (isUndefined(schedule) || isEmpty(schedule)) {
    if (leading) {
      setTimeout(wrapper, 1);
      logger.info(`Configured initial service ${suffix}.`);
    }
    return;
  }
  const pattern = /^(\d+)$/;
  const [, milliseconds] = pattern.exec(schedule) ?? [];
  if (milliseconds) {
    const scheduler = new ToadScheduler();
    const task = new Task(`${service} Task`, wrapper);
    const job = new SimpleIntervalJob({ milliseconds: parseInt(milliseconds), runImmediately: leading }, task);
    scheduler.addSimpleIntervalJob(job);
    logger.info(`Configured interval service ${suffix}.`);
  } else {
    if (leading) {
      setTimeout(wrapper, 1);
    }
    cron.schedule(schedule, wrapper);
    logger.info(`Configured scheduled service ${suffix}.`);
  }
};

const startService = (filename: string | URL, options?: WorkerOptions): Promise<void> | undefined => {
  const useWorkerThreads = false;
  // workers currently do not work in the nextjs runtime
  if (useWorkerThreads && process.env.NODE_ENV === "production" && isMainThread) {
    const name = options?.name ? `${options.name} ` : "";
    logger.info(`Starting ${name}in a worker thread.`);
    return new Promise((resolve, reject) => {
      const worker = new Worker(filename, options);
      worker.on("message", resolve);
      worker.on("error", reject);
      worker.on("exit", (code) => {
        if (code !== 0) reject(new Error(`Service worker ${name}stopped with exit code ${code}`));
      });
    });
  }
};

function buildOptions(options: ServiceOptions): Readonly<ServiceOptions>;
function buildOptions<T extends {}>(options: ServiceOptions, state: T): ServiceState<T>;
function buildOptions<T extends {}>(options: ServiceOptions, state?: T): Readonly<ServiceOptions> | ServiceState<T> {
  if (process.env.PROXY_HOST && process.env.PROXY_PORT) {
    options.proxy = {
      host: process.env.PROXY_HOST,
      port: parseInt(process.env.PROXY_PORT),
      ...(process.env.PROXY_PROTOCOL && { protocol: process.env.PROXY_PROTOCOL }),
    };
  }
  return state ? merge(options, { state: state }) : options;
}

export { schedule, startService, buildOptions };
