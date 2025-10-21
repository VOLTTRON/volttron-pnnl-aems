"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Frequency extends base_1.default {
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
        this.Second = this.parseStrict("second");
        this.SecondType = this.parseStrict("second");
        this.Minute = this.parseStrict("minute");
        this.MinuteType = this.parseStrict("minute");
        this.Hour = this.parseStrict("hour");
        this.HourType = this.parseStrict("hour");
        this.Day = this.parseStrict("day");
        this.DayType = this.parseStrict("day");
    }
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
exports.default = frequency;
//# sourceMappingURL=frequency.js.map