import { isEmpty, isEqual, isUndefined, merge, toLower } from "lodash";
import cron from "node-cron";
import { isMainThread, Worker } from "node:worker_threads";
import { SimpleIntervalJob, Task, ToadScheduler } from "toad-scheduler";

import { logger } from "@/logging";
import { ServiceOptions, ServiceState } from "./types";

export interface Cancellable {
  stop(): void | Promise<void>;
}

const scheduler = new ToadScheduler();

/**
 * Schedule a service worker to run at a specific interval or cron schedule.
 * @param worker
 * @param options
 * @returns
 */
const schedule = (
  worker: (initial?: boolean) => Promise<void>,
  { schedule, service, leading, type }: ServiceOptions
): Cancellable | undefined => {
  const instance = process.env.CLUSTER_TYPE ?? "";
  const types = instance.split(/[, |-]+/).map(toLower);
  const runAll = isEmpty(instance) || isEqual(types, ["services"]);
  const runService = service === undefined || types.includes(toLower(service));
  if (!(runAll || runService)) {
    return;
  }
  const wrapper = (() => {
    let errors = 0;
    let initial = true;
    let running = false;
    return async () => {
      if (!running) {
        running = true;
        try {
          await worker(initial);
          errors = 0;
        } catch (error) {
          if (errors === 0) {
            logger.error(error);
          }
          await new Promise((resolve) => setTimeout(resolve, Math.min(errors * errors * 1000, 60 * 1000)));
          errors++;
        } finally {
          initial = false;
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
    const task = new Task(`${service} Task`, wrapper);
    const job = new SimpleIntervalJob({ milliseconds: parseInt(milliseconds), runImmediately: leading }, task);
    scheduler.addSimpleIntervalJob(job);
    logger.info(`Configured interval service ${suffix}.`);
    return job;
  } else {
    if (leading) {
      setTimeout(wrapper, 1);
    }
    const task = cron.schedule(schedule, wrapper);
    logger.info(`Configured scheduled service ${suffix}.`);
    return task;
  }
};

/**
 * Start a service in a worker thread.
 * @param filename
 * @param options
 * @returns
 */
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

/**
 * Build service options.
 * @param options
 */
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
