"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMinutes = toMinutes;
exports.toOccupiedRange = toOccupiedRange;
exports.toServiceWindow = toServiceWindow;
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