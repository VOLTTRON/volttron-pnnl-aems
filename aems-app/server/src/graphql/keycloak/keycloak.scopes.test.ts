import { AppConfigService } from "@/app.config";
import { AuthUser } from "@/auth";
import { PrismaService } from "@/prisma/prisma.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import {
  ExecutionResult,
  GraphQLField,
  GraphQLInputType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  execute,
  getNamedType,
  parse,
} from "graphql";
import { Context } from "..";
import { SchemaBuilderService } from "../builder.service";
import { KeycloakAdminService } from "./keycloak-admin.service";
import { KeycloakMutation } from "./mutate.service";
import { KeycloakObject } from "./object.service";
import { KeycloakQuery } from "./query.service";

jest.mock("@/prisma", () => ({ PrismaPubSub: jest.fn() }));

const config = { nodeEnv: "test", instanceName: "test", graphql: { pubsub: "" } } as unknown as AppConfigService;
const prisma = { prisma: {} } as unknown as PrismaService;

// Every admin call answers something plausible, so a field that gets past its scope resolves cleanly.
const answers: Record<string, unknown> = { lookupKeycloakUserId: "kc-user", hasAdminAccess: true };
const admin = new Proxy({} as KeycloakAdminService, {
  get: (_t, name: string) => () => Promise.resolve(name in answers ? answers[name] : name.startsWith("list") || name.startsWith("get") ? [] : undefined),
});

/** The schema with the keycloak aggregate, and the root fields only the aggregate added. */
function aggregate() {
  const subscriptions = new SubscriptionService(prisma, config);
  const baseline = new SchemaBuilderService(prisma, config, subscriptions);
  const builder = new SchemaBuilderService(prisma, config, subscriptions);
  // A schema needs a field on each root type to be valid.
  for (const b of [baseline, builder]) {
    b.queryField("noop", (t) => t.boolean({ resolve: () => true }));
    b.mutationField("noop", (t) => t.boolean({ resolve: () => true }));
    b.subscriptionField("tick", (t) =>
      t.boolean({ subscribe: () => subscriptions.asyncIterator<boolean>("Tick") as never, resolve: (v) => v as boolean }),
    );
  }
  new KeycloakQuery(builder, admin, new KeycloakObject(builder));
  new KeycloakMutation(builder, admin);
  for (const b of [baseline, builder]) b.onModuleInit();
  const before = baseline.toSchema();
  const schema = builder.toSchema();
  const added = (root: "query" | "mutation") => {
    const known = (root === "query" ? before.getQueryType() : before.getMutationType())!.getFields();
    const all = (root === "query" ? schema.getQueryType() : schema.getMutationType())!.getFields();
    return Object.values(all).filter((f) => !known[f.name]).map((field) => ({ root, field }));
  };
  return { schema, operations: [...added("query"), ...added("mutation")] };
}

const sample = (type: GraphQLInputType): unknown => {
  if (type instanceof GraphQLNonNull) return sample(type.ofType);
  if (type instanceof GraphQLList) return [sample(type.ofType)];
  return ({ Int: 1, Float: 1, Boolean: true } as Record<string, unknown>)[getNamedType(type).name] ?? "x";
};

const selection = (type: GraphQLOutputType) => (getNamedType(type) instanceof GraphQLObjectType ? "{ __typename }" : "");

function document({ root, field }: { root: string; field: GraphQLField<unknown, unknown> }) {
  const params = field.args.map((a) => `$${a.name}: ${a.type.toString()}`).join(", ");
  const args = field.args.map((a) => `${a.name}: $${a.name}`).join(", ");
  const variables = Object.fromEntries(field.args.map((a) => [a.name, sample(a.type)]));
  const text = `${root}${params ? ` (${params})` : ""} { ${field.name}${args ? `(${args})` : ""} ${selection(field.type)} }`;
  return { text, variables };
}

const as = (roles?: string): Context =>
  ({ user: roles === undefined ? undefined : { authRoles: new AuthUser("u", roles).roles } }) as Context;

// scenario: aggregate-requires-keycloak-scope
describe("every operation of the keycloak aggregate", () => {
  const { schema, operations } = aggregate();
  const run = async (op: (typeof operations)[number], roles?: string) => {
    const { text, variables } = document(op);
    return (await execute({ schema, document: parse(text), variableValues: variables, contextValue: as(roles) })) as ExecutionResult;
  };
  const refused = (result: ExecutionResult) => (result.errors ?? []).some((e) => /not authorized/i.test(e.message));

  it("is found: queries and mutations both", () => {
    expect(operations.filter((o) => o.root === "query").length).toBeGreaterThan(0);
    expect(operations.filter((o) => o.root === "mutation").length).toBeGreaterThan(0);
  });

  it("refuses every caller without the keycloak role, super included", async () => {
    const admitted: string[] = [];
    for (const op of operations) {
      for (const roles of [undefined, "", "user", "admin", "super", "admin,super"]) {
        if (!refused(await run(op, roles))) admitted.push(`${op.field.name} as ${roles ?? "anonymous"}`);
      }
    }
    expect(admitted).toEqual([]);
  });

  it("admits a caller with the keycloak role", async () => {
    const failed: string[] = [];
    for (const op of operations) {
      const result = await run(op, "keycloak");
      if (result.errors) failed.push(`${op.field.name}: ${result.errors.map((e) => e.message).join("; ")}`);
    }
    expect(failed).toEqual([]);
  });
});
