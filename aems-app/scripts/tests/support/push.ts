import { expect } from "@playwright/test";
import { container, docker, psql } from "./stack";

type Pushed = "Unit" | "Control";

const sql = (query: string) => psql("database", "aems", query);

/** The stage of a Unit or Control row, and its message. */
export function stage(table: Pushed, id: string): { stage: string; message: string } {
  const row = /^([^|]*)\|([\s\S]*)$/.exec(sql(`SELECT stage || '|' || coalesce(message, '') FROM "${table}" WHERE id = '${id}'`));
  return { stage: row?.[1] ?? "", message: row?.[2] ?? "" };
}

/**
 * Waits for a marked row's push to finish, and holds it to EXPECTED, Complete unless named. A push
 * that reached the other end is reported with its message at once rather than waited out.
 */
export async function pushed(
  table: Pushed,
  id: string,
  { expected = "Complete", timeout = 5 * 60_000 }: { expected?: "Complete" | "Fail"; timeout?: number } = {},
): Promise<{ stage: string; message: string }> {
  await expect
    .poll(() => stage(table, id).stage, { message: `${table} ${id} never left its push`, timeout, intervals: [2_000] })
    .toMatch(/^(Complete|Fail)$/);
  const reached = stage(table, id);
  expect(reached.stage, `${table} ${id} pushed to ${reached.stage}: ${reached.message}`).toBe(expected);
  return reached;
}

/** What a manager.<system> agent's configuration store holds under NAME; undefined while absent. */
export function managerStore(system: string, name: string): unknown {
  const store = JSON.parse(
    docker(
      "exec",
      "-u",
      "volttron",
      container("volttron"),
      "bash",
      "-lc",
      `cat $VOLTTRON_HOME/configuration_store/manager.${system}.store`,
    ),
  ) as Record<string, { data: string } | undefined>;
  const entry = store[name];
  return entry === undefined ? undefined : (JSON.parse(entry.data) as unknown);
}
