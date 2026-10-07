"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACKED_MODELS = exports.METADATA_FIELDS = void 0;
exports.changesWhatIsSent = changesWhatIsSent;
exports.reach = reach;
exports.writeAndMark = writeAndMark;
const common_1 = require("@local/common");
exports.METADATA_FIELDS = ["stage", "message", "correlation", "updatedAt", "createdAt"];
exports.TRACKED_MODELS = ["Configuration", "Setpoint", "Schedule", "Occupancy", "Holiday", "Unit", "Control"];
const WRITES = ["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert", "delete", "deleteMany"];
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "holiday"];
function isTracked(model) {
    return exports.TRACKED_MODELS.includes(model ?? "");
}
function changesWhatIsSent(operation, args) {
    if (!WRITES.includes(operation))
        return false;
    if (!operation.startsWith("update"))
        return true;
    const rows = Array.isArray(args.data) ? args.data : [args.data ?? {}];
    return rows.some((row) => Object.keys(row).some((key) => !exports.METADATA_FIELDS.includes(key)));
}
async function rowsOf(client, model, where) {
    if (!where)
        return [];
    const delegate = client[model.charAt(0).toLowerCase() + model.slice(1)];
    return (await delegate.findMany({ where, select: { id: true } })).map((r) => r.id);
}
async function configurationsOf(client, model, ids) {
    if (ids.length === 0)
        return [];
    const configurations = new Set();
    const add = (rows) => rows.forEach((r) => configurations.add(r.id));
    switch (model) {
        case "Configuration":
            ids.forEach((id) => configurations.add(id));
            break;
        case "Setpoint": {
            add(await client.configuration.findMany({ where: { setpointId: { in: ids } }, select: { id: true } }));
            const schedules = await client.schedule.findMany({ where: { setpointId: { in: ids } }, select: { id: true } });
            (await configurationsOf(client, "Schedule", schedules.map((s) => s.id))).forEach((id) => configurations.add(id));
            break;
        }
        case "Schedule":
            add(await client.configuration.findMany({
                where: { OR: DAYS.map((day) => ({ [`${day}ScheduleId`]: { in: ids } })) },
                select: { id: true },
            }));
            (await client.occupancy.findMany({ where: { scheduleId: { in: ids } }, select: { configurationId: true } })).forEach((o) => o.configurationId && configurations.add(o.configurationId));
            break;
        case "Occupancy":
            (await client.occupancy.findMany({ where: { id: { in: ids } }, select: { configurationId: true } })).forEach((o) => o.configurationId && configurations.add(o.configurationId));
            break;
        case "Holiday":
            add(await client.configuration.findMany({ where: { holidays: { some: { id: { in: ids } } } }, select: { id: true } }));
            break;
        default:
    }
    return [...configurations];
}
async function reach(client, model, ids, withConfiguration = false) {
    if (ids.length === 0)
        return { units: [], controls: [] };
    if (model === "Control")
        return { units: [], controls: ids };
    const configurations = model === "Unit" ? [] : await configurationsOf(client, model, ids);
    const direct = model === "Unit" ? ids : [];
    const units = await client.unit.findMany({
        where: { OR: [{ id: { in: direct } }, { configurationId: { in: configurations } }] },
        select: { id: true, configurationId: true, controlId: true },
    });
    const shared = model === "Unit" && withConfiguration ? units.map((u) => u.configurationId).filter((id) => !!id) : [];
    const siblings = shared.length > 0
        ? await client.unit.findMany({
            where: { configurationId: { in: shared } },
            select: { id: true, configurationId: true, controlId: true },
        })
        : [];
    const all = [...units, ...siblings];
    return {
        units: [...new Set(all.map((u) => u.id))],
        controls: [...new Set(all.map((u) => u.controlId).filter((id) => !!id))],
    };
}
function merge(...marks) {
    return {
        units: [...new Set(marks.flatMap((m) => m.units))],
        controls: [...new Set(marks.flatMap((m) => m.controls))],
    };
}
async function writeAndMark(client, model, operation, args, query) {
    if (!isTracked(model) || !changesWhatIsSent(operation, args)) {
        return { result: await query(args), marked: { units: [], controls: [] } };
    }
    const before = operation.startsWith("create") ? [] : await rowsOf(client, model, args.where);
    const rows = (Array.isArray(args.data) ? args.data : [args.data ?? {}]);
    const withConfiguration = rows.some((row) => "configuration" in row || "configurationId" in row);
    const reachedBefore = await reach(client, model, before, withConfiguration);
    const result = await query(args);
    const created = (Array.isArray(result) ? result : [result])
        .map((r) => (r && typeof r === "object" && "id" in r ? String(r.id) : undefined))
        .filter((id) => !!id);
    const reachedAfter = operation.startsWith("delete") ? { units: [], controls: [] } : await reach(client, model, [...new Set([...before, ...created])], withConfiguration);
    const marked = merge(reachedBefore, reachedAfter);
    const data = { stage: common_1.StageType.Update.enum, message: null };
    if (marked.units.length > 0)
        await client.unit.updateMany({ where: { id: { in: marked.units } }, data });
    if (marked.controls.length > 0)
        await client.control.updateMany({ where: { id: { in: marked.controls } }, data });
    return { result, marked };
}
//# sourceMappingURL=push-marking.js.map