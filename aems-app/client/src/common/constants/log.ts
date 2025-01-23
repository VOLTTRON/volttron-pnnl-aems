import Base from "./base";
import { ILog, Log_type } from "../types";

class Log extends Base<ILog> {
  constructor() {
    super([
      {
        name: "banner",
        label: "Banner",
        enum: Log_type.Banner,
        level: "0",
      },
      {
        name: "trace",
        label: "Trace",
        enum: Log_type.Trace,
        level: "10",
      },
      {
        name: "debug",
        label: "Debug",
        enum: Log_type.Debug,
        level: "20",
      },
      {
        name: "info",
        label: "Info",
        enum: Log_type.Info,
        level: "30",
      },
      {
        name: "warn",
        label: "Warn",
        enum: Log_type.Warn,
        level: "40",
      },
      {
        name: "error",
        label: "Error",
        enum: Log_type.Error,
        level: "50",
      },
      {
        name: "fatal",
        label: "Fatal",
        enum: Log_type.Fatal,
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
