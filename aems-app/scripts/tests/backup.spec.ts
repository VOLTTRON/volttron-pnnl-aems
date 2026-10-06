import { test, expect } from "@playwright/test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { appDir, container, docker, hostname, inspect, psql, run } from "./support/stack";

// Runs in the reboot project: it restarts the sidecar and restores the database under every other spec.
test.describe.configure({ mode: "serial" });

const secrets = path.join(appDir, "docker/secrets/backup");
const archives = path.join(appDir, "docker/backups");
const sql = (query: string) => psql("database", "aems", query);
// Markers go in a table nothing prunes: the restore restarts the services process, which prunes Log.
const marker = (id: string) =>
  sql(
    `INSERT INTO "Geography" (id, name, "group", type, geojson, "updatedAt") VALUES ('${id}', '${id}', 'test', 'test', '{"type":"Feature","properties":{},"geometry":{"type":"Point","coordinates":[0,0]}}', now())`,
  );
const has = (id: string) => Number(sql(`SELECT count(*) FROM "Geography" WHERE id = '${id}'`));

const stamp = Date.now();
const BEFORE = `backup-before-${stamp}`;
const AFTER = `backup-after-${stamp}`;
let archive: string | undefined;

// scenario: backup-keypair-first-boot
test("on first boot the sidecar generates an age keypair into docker/secrets/backup", async () => {
  test.setTimeout(5 * 60_000);
  const aside = fs.mkdtempSync(path.join(os.tmpdir(), "aems-backup-keys-"));
  for (const f of ["age.key", "age.pub"]) {
    if (fs.existsSync(path.join(secrets, f))) fs.renameSync(path.join(secrets, f), path.join(aside, f));
  }
  expect(fs.existsSync(path.join(secrets, "age.key"))).toBe(false);

  docker("restart", container("backup"));
  // The sidecar creates age.pub empty and then fills it, so the file exists before the key is in it.
  const published = () => (fs.existsSync(path.join(secrets, "age.pub")) ? fs.readFileSync(path.join(secrets, "age.pub"), "utf8").trim() : "");
  await expect.poll(published, { timeout: 2 * 60_000 }).toMatch(/^age1[0-9a-z]+$/);
  const pub = published();
  expect(fs.readFileSync(path.join(secrets, "age.key"), "utf8")).toContain("AGE-SECRET-KEY-");
  // The recipient is the one the private key derives, not merely a well-formed one.
  expect(docker("exec", container("backup"), "age-keygen", "-y", "/host-secrets/age.key").trim()).toBe(pub);
});

// scenario: backup-scheduled-encrypted
test("the sidecar takes an encrypted Postgres snapshot when the policy's schedule fires", async () => {
  test.setTimeout(20 * 60_000);
  marker(BEFORE);
  sql(
    `INSERT INTO "BackupDestination" (id, "policyId", name, type, enabled, "updatedAt") VALUES ('test-local', 'default', 'test local', 'Local', true, now()) ON CONFLICT (id) DO UPDATE SET enabled = true`,
  );
  const since = sql(`SELECT now()`);
  sql(`UPDATE "BackupPolicy" SET enabled = true, cron = '* * * * *' WHERE id = 'default'`);
  let runId = "";
  try {
    await expect
      .poll(
        () => {
          const [id, status] = sql(
            `SELECT id, status FROM "BackupRun" WHERE trigger = 'Scheduled' AND "createdAt" > '${since}' ORDER BY "createdAt" LIMIT 1`,
          ).split("|");
          runId = id ?? "";
          return status ?? "none";
        },
        { timeout: 15 * 60_000, intervals: [5_000] },
      )
      .toMatch(/^(Success|Failed|Cancelled)$/);
  } finally {
    sql(`UPDATE "BackupPolicy" SET enabled = false, cron = '0 2 * * *' WHERE id = 'default'`);
    // The schedule can fire once more in the minute it is turned off; let that run finish before
    // anything restores or restarts under it.
    await new Promise((resolve) => setTimeout(resolve, 65_000));
    await expect
      .poll(() => Number(sql(`SELECT count(*) FROM "BackupRun" WHERE status IN ('Queued', 'Running')`)), {
        timeout: 15 * 60_000,
        intervals: [5_000],
      })
      .toBe(0);
  }
  expect(sql(`SELECT status || ' ' || coalesce("errorMessage", '') FROM "BackupRun" WHERE id = '${runId}'`).trim()).toBe("Success");
  expect(sql(`SELECT status FROM "BackupComponent" WHERE "runId" = '${runId}' AND type = 'Postgres' AND name = 'database'`)).toBe(
    "Success",
  );

  archive = path.join(archives, `${runId}.tar.gz.age`);
  expect(fs.existsSync(archive), archive).toBe(true);
  const head = Buffer.alloc(32);
  const fd = fs.openSync(archive, "r");
  fs.readSync(fd, head, 0, head.length, 0);
  fs.closeSync(fd);
  expect(head.toString("latin1")).toMatch(/^age-encryption\.org\/v1\n/);
});

// scenario: backup-restores
test("a snapshot restores with the backup-restore scripts into a working database", async ({ request }) => {
  test.setTimeout(20 * 60_000);
  expect(archive, "the scheduled snapshot above").toBeTruthy();
  marker(AFTER);
  expect([has(BEFORE), has(AFTER)]).toEqual([1, 1]);

  if (process.platform === "win32") {
    run("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", ".\\backup-restore.ps1", "-Archive", archive!, "-Only", "database", "-Force"], {
      stdio: "pipe",
    });
  } else {
    run("bash", ["./backup-restore.sh", "--archive", archive!, "--only", "database", "--force"], { stdio: "pipe" });
  }

  expect([has(BEFORE), has(AFTER)]).toEqual([1, 0]);
  await expect
    .poll(() => inspect(container("server"), "{{.State.Health.Status}}"), { timeout: 10 * 60_000, intervals: [5_000] })
    .toBe("healthy");
  expect(Number(sql(`SELECT count(*) FROM "User" WHERE email = 'system-user@pnnl.gov'`))).toBe(1);
  sql(`DELETE FROM "Geography" WHERE id = '${BEFORE}'`);
  // The restore restarts the stack; leave it answering for whatever runs next.
  await expect
    .poll(async () => (await request.get(`https://${hostname}/auth/sso/realms/default`)).status(), { timeout: 10 * 60_000 })
    .toBe(200);
});
