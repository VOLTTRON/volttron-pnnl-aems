"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateKey = dateKey;
exports.todayIn = todayIn;
exports.toMinutes = toMinutes;
exports.toOccupiedRange = toOccupiedRange;
exports.toServiceWindow = toServiceWindow;
function dateKey(date) {
    return date.toISOString().slice(0, 10);
}
function todayIn(timezones, now = new Date()) {
    for (const timeZone of timezones) {
        if (!timeZone)
            continue;
        try {
            const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
                .formatToParts(now)
                .reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
            return `${parts.year}-${parts.month}-${parts.day}`;
        }
        catch {
        }
    }
    return dateKey(now);
}
function toMinutes(t) {
    if (!t)
        return null;
    const m = /^(\d{1,2}):(\d{2})$/.exec(t);
    if (!m)
        return null;
    return Number(m[1]) * 60 + Number(m[2]);
}
function toOccupiedRange(occupied, startTime, endTime) {
    if (!occupied)
        return "always_off";
    const s = toMinutes(startTime) ?? 0;
    const e = toMinutes(endTime) ?? 1440;
    if ((s === 0 || s === 1440) && (e === 0 || e === 1440))
        return "always_on";
    return { start: startTime ?? "00:00", end: e === 1440 ? "23:59" : (endTime ?? "00:00") };
}
function toServiceWindow(startTime, endTime) {
    const s = toMinutes(startTime);
    const e = toMinutes(endTime);
    if (s == null || e == null || s === e)
        return "always_off";
    if (s === 0 && e === 1440)
        return "always_on";
    return { start: startTime, end: e === 1440 ? "23:59" : endTime };
}
//# sourceMappingURL=config.occupancy.js.map