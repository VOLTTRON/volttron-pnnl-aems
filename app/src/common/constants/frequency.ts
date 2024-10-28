import { IBase, IFrequency } from "../types";
import Base from "./base";

class Frequency extends Base<IFrequency> implements IBase<IFrequency> {
  constructor() {
    super([
      {
        name: "second",
        label: "Second",
        abbr: "s",
        plural: "seconds",
        pattern: {
          postgres: "YYYY-MM-DD HH24:mm:ss",
          mysql: "%Y-%m-%d %H:%i:%s",
        },
      },
      {
        name: "minute",
        label: "Minute",
        abbr: "m",
        plural: "minutes",
        pattern: {
          postgres: "YYYY-MM-DD HH24:mm",
          mysql: "%Y-%m-%d %H:%i",
        },
      },
      {
        name: "hour",
        label: "Hour",
        abbr: "h",
        plural: "hours",
        pattern: {
          postgres: "YYYY-MM-DD HH24",
          mysql: "%Y-%m-%d %H",
        },
      },
      {
        name: "day",
        label: "Day",
        abbr: "d",
        plural: "days",
        pattern: {
          postgres: "YYYY-MM-DD",
          mysql: "%Y-%m-%d",
        },
      },
    ]);
  }

  // static references to objects
  Second = this.parseStrict("second");
  SecondType = this.parseStrict("second");
  Minute = this.parseStrict("minute");
  MinuteType = this.parseStrict("minute");
  Hour = this.parseStrict("hour");
  HourType = this.parseStrict("hour");
  Day = this.parseStrict("day");
  DayType = this.parseStrict("day");
}

const frequency = new Frequency();
frequency.matcher = (v) => {
  switch (v) {
    case "s":
    case "S":
      return "second";
    case "m":
    case "M":
      return "minute";
    case "h":
    case "H":
      return "hour";
    case "d":
    case "D":
      return "day";
    default:
      return v;
  }
};

export default frequency;
