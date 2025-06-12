import { ILog } from ".";
import Base from "./base";

class Log extends Base<ILog> {
  constructor() {
    super([
      {
        name: "trace",
        label: "Trace",
        enum: "Trace" as const,
        level: "10",
      },
      {
        name: "debug",
        label: "Debug",
        enum: "Debug" as const,
        level: "20",
      },
      {
        name: "info",
        label: "Info",
        enum: "Info" as const,
        level: "30",
      },
      {
        name: "warn",
        label: "Warn",
        enum: "Warn" as const,
        level: "40",
      },
      {
        name: "error",
        label: "Error",
        enum: "Error" as const,
        level: "50",
      },
      {
        name: "fatal",
        label: "Fatal",
        enum: "Fatal" as const,
        level: "60",
      },
    ]);
  }

  // static references to objects
  Trace = this.parseStrict("trace");
  TraceType = this.parseStrict("trace");
  Debug = this.parseStrict("debug");
  DebugType = this.parseStrict("debug");
  Info = this.parseStrict("info");
  InfoType = this.parseStrict("info");
  Warn = this.parseStrict("warn");
  WarnType = this.parseStrict("warn");
  Error = this.parseStrict("error");
  ErrorType = this.parseStrict("error");
  Fatal = this.parseStrict("fatal");
  FatalType = this.parseStrict("fatal");
}

const log = new Log();

export default log;
