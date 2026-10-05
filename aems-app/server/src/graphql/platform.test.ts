import { AppConfigService } from "@/app.config";
import { AuthUser } from "@/auth";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { RoleType } from "@local/common";
import { Prisma } from "@prisma/client";
import * as fs from "node:fs";
import * as path from "node:path";
import { buildSchema, execute, ExecutionResult, GraphQLList, GraphQLNonNull, GraphQLObjectType, parse, subscribe } from "graphql";
import { SchemaBuilderService } from "./builder.service";
import { Context } from ".";

jest.mock("@/prisma", () => ({ PrismaPubSub: jest.fn() }));

const config = { nodeEnv: "test", instanceName: "test", graphql: { pubsub: "" } } as unknown as AppConfigService;
const prisma = { prisma: {} } as unknown as PrismaService;

function platform() {
  const subscriptions = new SubscriptionService(prisma, config);
  const builder = new SchemaBuilderService(prisma, config, subscriptions);
  // A schema needs a field on each root type to be valid.
  builder.mutationField("noop", (t) => t.boolean({ resolve: () => true }));
  builder.subscriptionField("tick", (t) => t.boolean({ subscribe: () => subscriptions.asyncIterator<boolean>("Tick") as never, resolve: (v) => v as boolean }));
  return { builder, subscriptions };
}

const as = (roles?: string): Context => ({ user: roles === undefined ? undefined : { authRoles: new AuthUser("u", roles).roles } }) as Context;

async function run(builder: SchemaBuilderService, query: string, context: Context = as("user")) {
  builder.onModuleInit();
  return (await execute({ schema: builder.toSchema(), document: parse(query), contextValue: context })) as ExecutionResult;
}

describe("the GraphQL platform", () => {
  // scenario: builder-plugins
  it("builds every schema with the prisma, relay, scope-auth, complexity and smart-subscriptions plugins", () => {
    const { builder } = platform();
    expect(builder.options.plugins).toEqual(expect.arrayContaining(["prisma", "relay", "scopeAuth", "complexity", "smartSubscriptions"]));
  });

  // scenario: query-limits-refuse
  it("refuses a query over complexity 5000 or depth 10", async () => {
    const { builder } = platform();
    type Deep = { n: number };
    const Deep = builder.objectRef<Deep>("Deep");
    Deep.implement({
      fields: (t) => ({
        n: t.exposeInt("n"),
        next: t.field({ type: Deep, resolve: (p) => ({ n: p.n + 1 }) }),
        many: t.field({ type: [Deep], resolve: (p) => [{ n: p.n + 1 }] }),
      }),
    });
    builder.queryField("deep", (t) => t.field({ type: Deep, resolve: () => ({ n: 0 }) }));

    const nested = (depth: number) => `{ deep { ${"next { ".repeat(depth - 2)}n${" }".repeat(depth - 2)} } }`;
    // Each alias costs 1111 at the default list multiplier of 10, so four fit under 5000 and five do not.
    const wide = (aliases: number) =>
      `{ deep { ${Array.from({ length: aliases }, (_, i) => `a${i}: many { many { many { n } } }`).join(" ")} } }`;

    expect((await run(builder, nested(10))).errors).toBeUndefined();
    expect((await run(builder, nested(11))).errors?.[0].message).toMatch(/depth/i);
    expect((await run(builder, wide(4))).errors).toBeUndefined();
    expect((await run(builder, wide(5))).errors?.[0].message).toMatch(/complexity/i);
  });

  // scenario: field-scopes-refuse
  it("refuses a field whose authScopes the caller lacks, and evaluates an anonymous caller with the default roles", async () => {
    const { builder } = platform();
    const scopes = RoleType.values.map((r) => r.enum);
    for (const scope of scopes) {
      builder.queryField(`only_${scope}`, (t) => t.string({ authScopes: { [scope]: true }, resolve: () => scope }));
    }
    const query = `{ ${scopes.map((s) => `only_${s}`).join(" ")} }`;
    const refused = (result: ExecutionResult) =>
      (result.errors ?? []).map((e) => {
        expect(e.message).toMatch(/not authorized/i);
        return String(e.path?.[0]).replace(/^only_/, "");
      }).sort();

    const defaults = new AuthUser().roles;
    expect(refused(await run(builder, query, as()))).toEqual(scopes.filter((s) => !defaults[s]).sort());
    const user = new AuthUser("u", "user").roles;
    expect(refused(await run(builder, query, as("user")))).toEqual(scopes.filter((s) => !user[s]).sort());
    expect(refused(await run(builder, query, as("user")))).toContain("admin");
  });

  // scenario: subscription-reresolves
  it("authorises a subscription once, when it opens, and re-resolves it on every publish to a topic it watches", async () => {
    const { builder, subscriptions } = platform();
    let checks = 0;
    let resolved = 0;
    builder.queryField("counter", (t) =>
      t.int({
        smartSubscription: true,
        subscribe: (subs) => subs.register("Banner"),
        authScopes: () => {
          checks++;
          return { user: true };
        },
        resolve: () => ++resolved,
      }),
    );
    builder.onModuleInit();
    const schema = builder.toSchema();
    const open = (context: Context) => subscribe({ schema, document: parse("subscription { counter }"), contextValue: context });

    const anonymous = (await open(as())) as ExecutionResult;
    expect(anonymous.errors?.[0].message).toMatch(/not authorized/i);

    checks = 0;
    const stream = (await open(as("user"))) as AsyncIterableIterator<ExecutionResult>;
    expect(checks).toBe(1);
    const values: unknown[] = [];
    for (let i = 0; i < 2; i++) {
      const next = stream.next();
      await new Promise((r) => setImmediate(r));
      await subscriptions.publish("Banner", { topic: "Banner", id: "b1", type: "Update" } as never);
      values.push((await next).value?.data?.counter);
    }
    await stream.return?.();
    expect(values).toEqual([1, 2]);
    expect(checks).toBe(1);
  });

  // scenario: aggregate-query-names
  it("exposes page, read, reads, count and group for every aggregate", () => {
    const schema = buildSchema(fs.readFileSync(path.join(__dirname, "../../schema.graphql"), "utf8"));
    const query = schema.getQueryType()!.getFields();
    const named = (type: unknown): string | undefined =>
      type instanceof GraphQLNonNull || type instanceof GraphQLList ? named(type.ofType) : (type as GraphQLObjectType).name;

    // An aggregate is a model the Query root reaches directly; one reached only through another
    // model's relations (a BackupRun's components) is part of that aggregate.
    const plural = (model: string) =>
      Object.keys(query).find((f) => /^read/.test(f) && named(query[f].type) === model && query[f].type.toString().includes("["));
    const aggregates = Object.values(Prisma.ModelName).filter(
      (m) => schema.getType(m) instanceof GraphQLObjectType && (query[`page${m}`] || query[`read${m}`] || plural(m)),
    );
    expect(aggregates.length).toBeGreaterThan(10);
    const missing = aggregates.flatMap((model) => {
      const p = (plural(model) ?? `read${model}s`).slice("read".length);
      return [`page${model}`, `read${model}`, `read${p}`, `count${p}`, `group${p}`].filter((n) => !query[n]);
    });
    expect(missing).toEqual([]);
  });
});
