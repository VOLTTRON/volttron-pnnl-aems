jest.mock("node:fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@nestjs/apollo", () => ({
  ApolloDriver: class MockApolloDriver {
    constructor(_modulesContainer: unknown) {}
    async start(_options: unknown) {}
    registerServer(_options: unknown) {}
  },
}));

jest.mock("graphql", () => {
  const actual = jest.requireActual<typeof import("graphql")>("graphql");
  return {
    ...actual,
    printSchema: jest.fn(() => "type Query { hello: String }"),
    lexicographicSortSchema: jest.fn((schema: unknown) => schema),
  };
});

import { readFile, writeFile } from "node:fs/promises";
import { PothosApolloDriver } from "./pothos.driver";
import { ModulesContainer } from "@nestjs/core";
import { SchemaBuilderService } from "./builder.service";
import { PothosBuilderKey } from "./pothos.decorator";
import { GraphQLSchema } from "graphql";

const mockReadFile = readFile as jest.MockedFunction<typeof readFile>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;

function makeSchema(): GraphQLSchema {
  return {} as GraphQLSchema;
}

function makeSchemaBuilder(schema: GraphQLSchema = makeSchema()): SchemaBuilderService {
  return {
    awaitSchema: jest.fn().mockResolvedValue(schema),
  } as unknown as SchemaBuilderService;
}

function makeModulesContainer(schemaBuilder: SchemaBuilderService | null = makeSchemaBuilder()): ModulesContainer {
  const providers = new Map<string, any>();

  if (schemaBuilder) {
    const metatype = class SchemaBuilderServiceMock {};
    Reflect.defineMetadata(PothosBuilderKey, true, metatype);

    providers.set("SchemaBuilderService", {
      metatype,
      instance: schemaBuilder,
    });
  }

  const modules = new Map<string, any>();
  modules.set("GraphQLModule", { providers });

  return modules as unknown as ModulesContainer;
}

describe("PothosApolloDriver.start", () => {
  beforeEach(() => jest.clearAllMocks());

  it("throws when SchemaBuilderService cannot be found in modules container", async () => {
    const driver = new PothosApolloDriver(makeModulesContainer(null));

    await expect(driver.start({})).rejects.toThrow("Unable to find SchemaBuilderService");
  });

  it("calls awaitSchema on the found builder service", async () => {
    const builder = makeSchemaBuilder();
    const driver = new PothosApolloDriver(makeModulesContainer(builder));

    await driver.start({ autoSchemaFile: "schema.graphql", sortSchema: false });

    expect(builder.awaitSchema).toHaveBeenCalled();
  });
});

describe("PothosApolloDriver.registerServer (printSchema via autoSchemaFile)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("writes schema file when it does not exist yet", async () => {
    mockReadFile.mockRejectedValueOnce(new Error("ENOENT"));

    const builder = makeSchemaBuilder();
    const driver = new PothosApolloDriver(makeModulesContainer(builder));
    await driver.start({ autoSchemaFile: "schema.graphql", sortSchema: false });
    driver.registerServer({ autoSchemaFile: "schema.graphql", sortSchema: false } as any);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("does not rewrite the primary schema file when content is unchanged", async () => {
    const schemaContent = "type Query { hello: String }";
    mockReadFile.mockResolvedValue(Buffer.from(schemaContent) as any);

    const builder = makeSchemaBuilder();
    const driver = new PothosApolloDriver(makeModulesContainer(builder));
    await driver.start({ autoSchemaFile: "schema.graphql", sortSchema: false });
    driver.registerServer({ autoSchemaFile: "schema.graphql", sortSchema: false } as any);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("rewrites schema file when content has changed", async () => {
    const oldContent = "type Query { old: String }";
    mockReadFile.mockResolvedValue(Buffer.from(oldContent) as any);

    const builder = makeSchemaBuilder();
    const driver = new PothosApolloDriver(makeModulesContainer(builder));
    await driver.start({ autoSchemaFile: "schema.graphql", sortSchema: false });
    driver.registerServer({ autoSchemaFile: "schema.graphql", sortSchema: false } as any);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockWriteFile).toHaveBeenCalled();
  });

  it("does not write to disk when autoSchemaFile is not set", async () => {
    const builder = makeSchemaBuilder();
    const driver = new PothosApolloDriver(makeModulesContainer(builder));
    await driver.start({});
    driver.registerServer({} as any);

    await new Promise((r) => setTimeout(r, 10));

    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
