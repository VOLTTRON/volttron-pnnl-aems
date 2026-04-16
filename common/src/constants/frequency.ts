import { IBase, IFrequency } from ".";
import Base from "./base";

class Frequency extends Base<IFrequency> implements IBase<IFrequency> {
  constructor() {
    super([
      {
        name: "millisecond",
        label: "Millisecond",
        abbr: "ms",
        plural: "milliseconds",
        milliseconds: 1,
        pattern: {
          postgres: "YYYY-MM-DD HH24:mm:ss.MS",
          mysql: "%Y-%m-%d %H:%i:%s.%f",
        },
      },
      {
        name: "second",
        label: "Second",
        abbr: "s",
        plural: "seconds",
        milliseconds: 1000,
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
        milliseconds: 60 * 1000,
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
        milliseconds: 60 * 60 * 1000,
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
        milliseconds: 24 * 60 * 60 * 1000,
        pattern: {
          postgres: "YYYY-MM-DD",
          mysql: "%Y-%m-%d",
        },
      },
      {
        name: "week",
        label: "Week",
        abbr: "w",
        plural: "weeks",
        milliseconds: 7 * 24 * 60 * 60 * 1000,
        pattern: {
          postgres: "IYYY-IW",
          mysql: "%Y-%u",
        },
      },
      {
        name: "month",
        label: "Month",
        abbr: "mo",
        plural: "months",
        milliseconds: 30 * 24 * 60 * 60 * 1000, // Average month (30 days)
        pattern: {
          postgres: "YYYY-MM",
          mysql: "%Y-%m",
        },
      },
      {
        name: "year",
        label: "Year",
        abbr: "y",
        plural: "years",
        milliseconds: 365.25 * 24 * 60 * 60 * 1000, // Average year accounting for leap years
        pattern: {
          postgres: "YYYY",
          mysql: "%Y",
        },
      },
    ]);
  }

  // static references to objects
  Millisecond = this.parseStrict("millisecond");
  MillisecondType = this.parseStrict("millisecond");
  Second = this.parseStrict("second");
  SecondType = this.parseStrict("second");
  Minute = this.parseStrict("minute");
  MinuteType = this.parseStrict("minute");
  Hour = this.parseStrict("hour");
  HourType = this.parseStrict("hour");
  Day = this.parseStrict("day");
  DayType = this.parseStrict("day");
  Week = this.parseStrict("week");
  WeekType = this.parseStrict("week");
  Month = this.parseStrict("month");
  MonthType = this.parseStrict("month");
  Year = this.parseStrict("year");
  YearType = this.parseStrict("year");

  /**
   * Convert a value from one frequency to another frequency.
   * Static method for converting between any two frequencies.
   * 
   * @param from - The source frequency to convert from
   * @param value - The numeric value to convert
   * @param to - The target frequency to convert to
   * @returns The converted value
   * 
   * @example
   * Frequency.convert('day', 7, 'week') // returns 1
   * Frequency.convert('hour', 24, 'day') // returns 1
   * Frequency.convert('month', 1, 'day') // returns ~30
   */
  static convert(
    from: IFrequency | number | string,
    value: number,
    to: IFrequency | number | string,
  ): number {
    const fromFreq = frequency.parseStrict(from);
    const toFreq = frequency.parseStrict(to);
    const milliseconds = value * fromFreq.milliseconds;
    return milliseconds / toFreq.milliseconds;
  }

  /**
   * Convert a value from one frequency to another frequency.
   * Instance method for use with the frequency singleton.
   * 
   * @param from - The source frequency to convert from
   * @param value - The numeric value to convert
   * @param to - The target frequency to convert to
   * @returns The converted value
   * 
   * @example
   * frequency.convert('day', 7, 'week') // returns 1
   * frequency.convert('hour', 24, 'day') // returns 1
   */
  convert(
    from: IFrequency | number | string,
    value: number,
    to: IFrequency | number | string,
  ): number {
    return Frequency.convert(from, value, to);
  }
}

const frequency = new Frequency();
frequency.matcher = (v) => {
  switch (v) {
    case "ms":
    case "MS":
      return "millisecond";
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
    case "w":
    case "W":
      return "week";
    case "mo":
    case "MO":
      return "month";
    case "y":
    case "Y":
      return "year";
    default:
      return v;
  }
};

export default frequency;
