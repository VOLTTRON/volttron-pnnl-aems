"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("./base");
class Holiday extends base_1.default {
    constructor() {
        super([
            {
                name: "new-years-day",
                label: "New Year's Day",
            },
            {
                name: "martin-luther-king-jr",
                label: "Martin Luther King Jr",
            },
            {
                name: "presidents-day",
                label: "Presidents Day",
            },
            {
                name: "memorial-day",
                label: "Memorial Day",
            },
            {
                name: "juneteenth",
                label: "Juneteenth",
            },
            {
                name: "independence-day",
                label: "Independence Day",
            },
            {
                name: "labor-day",
                label: "Labor Day",
            },
            {
                name: "columbus-day",
                label: "Columbus Day",
            },
            {
                name: "veterans-day",
                label: "Veterans Day",
            },
            {
                name: "thanksgiving",
                label: "Thanksgiving",
            },
            {
                name: "black-friday",
                label: "Black Friday",
            },
            {
                name: "christmas-eve",
                label: "Christmas Eve",
            },
            {
                name: "christmas",
                label: "Christmas",
            },
        ]);
        this.NewYearsDay = this.parseStrict("new-years-day");
        this.NewYearsDayType = this.parseStrict("new-years-day");
        this.MartinLutherKingJr = this.parseStrict("martin-luther-king-jr");
        this.MartinLutherKingJrType = this.parseStrict("martin-luther-king-jr");
        this.PresidentsDay = this.parseStrict("presidents-day");
        this.PresidentsDayType = this.parseStrict("presidents-day");
        this.MemorialDay = this.parseStrict("memorial-day");
        this.MemorialDayType = this.parseStrict("memorial-day");
        this.Juneteenth = this.parseStrict("juneteenth");
        this.JuneteenthType = this.parseStrict("juneteenth");
        this.IndependenceDay = this.parseStrict("independence-day");
        this.IndependenceDayType = this.parseStrict("independence-day");
        this.LaborDay = this.parseStrict("labor-day");
        this.LaborDayType = this.parseStrict("labor-day");
        this.ColumbusDay = this.parseStrict("columbus-day");
        this.ColumbusDayType = this.parseStrict("columbus-day");
        this.VeteransDay = this.parseStrict("veterans-day");
        this.VeteransDayType = this.parseStrict("veterans-day");
        this.Thanksgiving = this.parseStrict("thanksgiving");
        this.ThanksgivingType = this.parseStrict("thanksgiving");
        this.BlackFriday = this.parseStrict("black-friday");
        this.BlackFridayType = this.parseStrict("black-friday");
        this.ChristmasEve = this.parseStrict("christmas-eve");
        this.ChristmasEveType = this.parseStrict("christmas-eve");
        this.Christmas = this.parseStrict("christmas");
        this.ChristmasType = this.parseStrict("christmas");
    }
}
const holiday = new Holiday();
exports.default = holiday;
//# sourceMappingURL=holiday.js.map