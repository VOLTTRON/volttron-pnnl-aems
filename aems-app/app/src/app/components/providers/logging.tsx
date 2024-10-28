"use client";

import { createContext, useEffect, useState } from "react";
import { format } from "util";

interface ConsoleExt extends Console {
  stdLog?: typeof console.log;
  stdInfo?: typeof console.info;
  stdWarn?: typeof console.warn;
  stdError?: typeof console.error;
}

export type LogType = keyof Pick<Console, "log" | "info" | "warn" | "error">;

export interface Log {
  timestamp: number;
  type: LogType;
  message: string;
}

const isDisabled = process.env.NODE_ENV === "development";

const disabledLog: Log = { timestamp: Date.now(), type: "log", message: "Logging is disabled in development mode." };

export const LoggingContext = createContext<{ logs: Log[] }>({ logs: [] });

export function LoggingProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<Log[]>(isDisabled ? [disabledLog] : []);

  useEffect(() => {
    if (isDisabled) {
      return () => {
        // logging is disabled
      };
    }
    const consoleExt = console as ConsoleExt;
    if (consoleExt.stdLog === undefined) {
      consoleExt.stdLog = console.log;
      console.log = (...args: any[]) => {
        const message = format(...args);
        if (!message.includes("Warning: Maximum update depth exceeded.")) {
          setLogs((logs) => [...logs, { timestamp: Date.now(), type: "log", message: message }]);
        }
        consoleExt.stdLog?.(...args);
      };
    }
    if (consoleExt.stdError === undefined) {
      consoleExt.stdError = console.error;
      console.error = (...args: any[]) => {
        const message = format(...args);
        if (!message.includes("Warning: Maximum update depth exceeded.")) {
          setLogs((logs) => [...logs, { timestamp: Date.now(), type: "error", message: message }]);
        }
        consoleExt.stdError?.(...args);
      };
    }

    return () => {
      const consoleExt = console as ConsoleExt;
      if (consoleExt.stdLog !== undefined) {
        console.log = consoleExt.stdLog;
        consoleExt.stdLog = undefined;
      }
      if (consoleExt.stdError !== undefined) {
        console.error = consoleExt.stdError;
        consoleExt.stdError = undefined;
      }
    };
  }, []);

  return <LoggingContext.Provider value={{ logs }}>{children}</LoggingContext.Provider>;
}
