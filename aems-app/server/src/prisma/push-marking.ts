import { StageType } from "@local/common";

/** Fields whose change alone sends nothing to VOLTTRON, so marks nothing for a push. */
export const METADATA_FIELDS = ["stage", "message", "correlation", "updatedAt", "createdAt"];

/** The models whose writes change what a unit or control sends. */
export const TRACKED_MODELS = ["Configuration", "Setpoint", "Schedule", "Occupancy", "Holiday", "Unit", "Control"] as const;
export type TrackedModel = (typeof TRACKED_MODELS)[number];

const WRITES = ["create", "createMany", "createManyAndReturn", "update", "updateMany", "updateManyAndReturn", "upsert", "delete", "deleteMany"];

export interface Marked {
  units: string[];
  controls: string[];
}

type Ids = { id: string }[];
type Where = Record<string, unknown>;

/** The part of an unextended Prisma client the marking reads and writes through. */
export interface MarkingClient {
  configuration: { findMany(args: { where: Where; select: { id: true } }): Promise<Ids> };
  schedule: { findMany(args: { where: Where; select: { id: true } }): Promise<Ids> };
  occupancy: { findMany(args: { where: Where; select: { configurationId: true } }): Promise<{ configurationId: string | null }[]> };
  unit: {
    findMany(args: { where: Where; select: { id: true; configurationId: true; controlId: true } }): Promise<
      { id: string; configurationId: string | null; controlId: string | null }[]
    >;
    updateMany(args: { where: Where; data: Where }): Promise<unknown>;
  };
  control: { updateMany(args: { where: Where; data: Where }): Promise<unknown> };
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "holiday"];

function isTracked(model: string | undefined): model is TrackedModel {
  return (TRACKED_MODELS as readonly string[]).includes(model ?? "");
}

/** Whether a write can change what is sent: anything but an update of metadata alone. */
export function changesWhatIsSent(operation: string, args: { data?: unknown }): boolean {
  if (!WRITES.includes(operation)) return false;
  if (!operation.startsWith("update")) return true;
  const rows = Array.isArray(args.data) ? args.data : [args.data ?? {}];
  return rows.some((row) => Object.keys(row as object).some((key) => !METADATA_FIELDS.includes(key)));
}

/** The ids a write's WHERE names now, or its result names, read through the unextended client. */
async function rowsOf(client: MarkingClient, model: TrackedModel, where: Where | undefined): Promise<string[]> {
  if (!where) return [];
  const delegate = (client as unknown as Record<string, { findMany(args: object): Promise<Ids> }>)[
    model.charAt(0).toLowerCase() + model.slice(1)
  ];
  return (await delegate.findMany({ where, select: { id: true } })).map((r) => r.id);
}

/** Every configuration a set of rows of MODEL reaches. */
async function configurationsOf(client: MarkingClient, model: TrackedModel, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const configurations = new Set<string>();
  const add = (rows: Ids) => rows.forEach((r) => configurations.add(r.id));
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
      add(
        await client.configuration.findMany({
          where: { OR: DAYS.map((day) => ({ [`${day}ScheduleId`]: { in: ids } })) },
          select: { id: true },
        }),
      );
      (await client.occupancy.findMany({ where: { scheduleId: { in: ids } }, select: { configurationId: true } })).forEach(
        (o) => o.configurationId && configurations.add(o.configurationId),
      );
      break;
    case "Occupancy":
      (await client.occupancy.findMany({ where: { id: { in: ids } }, select: { configurationId: true } })).forEach(
        (o) => o.configurationId && configurations.add(o.configurationId),
      );
      break;
    case "Holiday":
      add(await client.configuration.findMany({ where: { holidays: { some: { id: { in: ids } } } }, select: { id: true } }));
      break;
    default:
  }
  return [...configurations];
}

/** The units and controls a set of rows of MODEL reaches, as they stand now. */
export async function reach(client: MarkingClient, model: TrackedModel, ids: string[], withConfiguration = false): Promise<Marked> {
  if (ids.length === 0) return { units: [], controls: [] };
  if (model === "Control") return { units: [], controls: ids };
  const configurations = model === "Unit" ? [] : await configurationsOf(client, model, ids);
  const direct = model === "Unit" ? ids : [];
  const units = await client.unit.findMany({
    where: { OR: [{ id: { in: direct } }, { configurationId: { in: configurations } }] },
    select: { id: true, configurationId: true, controlId: true },
  });
  // A unit edited through updateUnit may carry its configuration with it, which every unit using that
  // configuration sends.
  const shared = model === "Unit" && withConfiguration ? units.map((u) => u.configurationId).filter((id): id is string => !!id) : [];
  const siblings =
    shared.length > 0
      ? await client.unit.findMany({
          where: { configurationId: { in: shared } },
          select: { id: true, configurationId: true, controlId: true },
        })
      : [];
  const all = [...units, ...siblings];
  return {
    units: [...new Set(all.map((u) => u.id))],
    controls: [...new Set(all.map((u) => u.controlId).filter((id): id is string => !!id))],
  };
}

function merge(...marks: Marked[]): Marked {
  return {
    units: [...new Set(marks.flatMap((m) => m.units))],
    controls: [...new Set(marks.flatMap((m) => m.controls))],
  };
}

/**
 * Runs one write and marks for a push every unit and control it changes what is sent for: those it
 * reached before the write (a delete, a unit moved off a control) and those it reaches after.
 * Returns the write's result and what was marked.
 */
export async function writeAndMark<T>(
  client: MarkingClient,
  model: string | undefined,
  operation: string,
  args: { where?: Where; data?: unknown },
  query: (args: unknown) => Promise<T>,
): Promise<{ result: T; marked: Marked }> {
  if (!isTracked(model) || !changesWhatIsSent(operation, args)) {
    return { result: await query(args), marked: { units: [], controls: [] } };
  }
  const before = operation.startsWith("create") ? [] : await rowsOf(client, model, args.where);
  const rows = (Array.isArray(args.data) ? args.data : [args.data ?? {}]) as object[];
  const withConfiguration = rows.some((row) => "configuration" in row || "configurationId" in row);
  const reachedBefore = await reach(client, model, before, withConfiguration);
  const result = await query(args);
  const created = (Array.isArray(result) ? result : [result])
    .map((r) => (r && typeof r === "object" && "id" in r ? String((r as { id: unknown }).id) : undefined))
    .filter((id): id is string => !!id);
  const reachedAfter = operation.startsWith("delete") ? { units: [], controls: [] } : await reach(client, model, [...new Set([...before, ...created])], withConfiguration);
  const marked = merge(reachedBefore, reachedAfter);
  const data = { stage: StageType.Update.enum, message: null };
  if (marked.units.length > 0) await client.unit.updateMany({ where: { id: { in: marked.units } }, data });
  if (marked.controls.length > 0) await client.control.updateMany({ where: { id: { in: marked.controls } }, data });
  return { result, marked };
}
