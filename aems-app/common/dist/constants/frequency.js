"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Frequency extends base_1.default {
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
                milliseconds: 30 * 24 * 60 * 60 * 1000,
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
                milliseconds: 365.25 * 24 * 60 * 60 * 1000,
                pattern: {
                    postgres: "YYYY",
                    mysql: "%Y",
                },
            },
        ]);
        this.Millisecond = this.parseStrict("millisecond");
        this.MillisecondType = this.parseStrict("millisecond");
        this.Second = this.parseStrict("second");
        this.SecondType = this.parseStrict("second");
        this.Minute = this.parseStrict("minute");
        this.MinuteType = this.parseStrict("minute");
        this.Hour = this.parseStrict("hour");
        this.HourType = this.parseStrict("hour");
        this.Day = this.parseStrict("day");
        this.DayType = this.parseStrict("day");
        this.Week = this.parseStrict("week");
        this.WeekType = this.parseStrict("week");
        this.Month = this.parseStrict("month");
        this.MonthType = this.parseStrict("month");
        this.Year = this.parseStrict("year");
        this.YearType = this.parseStrict("year");
    }
    static convert(from, value, to) {
        const fromFreq = frequency.parseStrict(from);
        const toFreq = frequency.parseStrict(to);
        const milliseconds = value * fromFreq.milliseconds;
        return milliseconds / toFreq.milliseconds;
    }
    convert(from, value, to) {
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
exports.default = frequency;
//# sourceMappingURL=frequency.js.map