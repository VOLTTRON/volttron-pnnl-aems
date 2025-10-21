"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Observance extends base_1.default {
    constructor() {
        super([
            {
                name: "after_nearest_workday",
                label: "After Nearest Workday",
            },
            {
                name: "before_nearest_workday",
                label: "Before Nearest Workday",
            },
            {
                name: "nearest_workday",
                label: "Nearest Workday",
            },
            {
                name: "next_monday",
                label: "Next Monday",
            },
            {
                name: "next_workday",
                label: "Next Workday",
            },
            {
                name: "previous_workday",
                label: "Previous Workday",
            },
            {
                name: "previous_friday",
                label: "Previous Friday",
            },
            {
                name: "sunday_to_monday",
                label: "Sunday to Monday",
            },
        ]);
        this.AfterNearestWorkday = this.parseStrict("after_nearest_workday");
        this.AfterNearestWorkdayType = this.parseStrict("after_nearest_workday");
        this.BeforeNearestWorkday = this.parseStrict("before_nearest_workday");
        this.BeforeNearestWorkdayType = this.parseStrict("before_nearest_workday");
        this.NearestWorkday = this.parseStrict("nearest_workday");
        this.NearestWorkdayType = this.parseStrict("nearest_workday");
        this.NextMonday = this.parseStrict("next_monday");
        this.NextMondayType = this.parseStrict("next_monday");
        this.NextWorkday = this.parseStrict("next_workday");
        this.NextWorkdayType = this.parseStrict("next_workday");
        this.PreviousWorkday = this.parseStrict("previous_workday");
        this.PreviousWorkdayType = this.parseStrict("previous_workday");
        this.PreviousFriday = this.parseStrict("previous_friday");
        this.PreviousFridayType = this.parseStrict("previous_friday");
        this.SundayToMonday = this.parseStrict("sunday_to_monday");
        this.SundayToMondayType = this.parseStrict("sunday_to_monday");
    }
}
const observance = new Observance();
exports.default = observance;
//# sourceMappingURL=observance.js.map