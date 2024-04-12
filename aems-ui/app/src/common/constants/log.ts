import { Log_type } from "@prisma/client";

import { ILog } from "../types";
import Base from "./base";

class Log extends Base<ILog> {
  constructor() {
    super([
      {
        name: "banner",
        label: "Banner",
        enum: "Banner" as Log_type,
        level: "0",
      },
      {
        name: "trace",
        label: "Trace",
        enum: "Trace" as Log_type,
        level: "10",
      },
      {
        name: "debug",
        label: "Debug",
        enum: "Debug" as Log_type,
        level: "20",
      },
      {
        name: "info",
        label: "Info",
        enum: "Info" as Log_type,
        level: "30",
      },
      {
        name: "warn",
        label: "Warn",
        enum: "Warn" as Log_type,
        level: "40",
      },
      {
        name: "error",
        label: "Error",
        enum: "Error" as Log_type,
        level: "50",
      },
      {
        name: "fatal",
        label: "Fatal",
        enum: "Fatal" as Log_type,
        level: "60",
      },
    ]);
  }

  // static references to objects
  Banner = this.parseStrict("banner");
  BannerType = this.parseStrict("banner");
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
