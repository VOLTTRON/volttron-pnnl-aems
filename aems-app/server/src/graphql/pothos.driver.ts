import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Injectable, Logger } from "@nestjs/common";
import { ModulesContainer } from "@nestjs/core";
import type { InstanceWrapper } from "@nestjs/core/injector/instance-wrapper";
import type { AutoSchemaFileValue, GqlModuleOptions, SchemaFileConfig } from "@nestjs/graphql";
import { SchemaBuilderService } from "./builder.service";
import { PothosBuilderKey } from "./pothos.decorator";
import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql";
import { resolve } from "node:path";
import { typeofObject } from "@local/common";
import { readFile, writeFile } from "node:fs/promises";

@Injectable()
export class PothosApolloDriver extends ApolloDriver {
  private logger = new Logger(PothosApolloDriver.name);
  private sortSchema: boolean | undefined;
  private autoSchemaFile: AutoSchemaFileValue | undefined;
  private schema: GraphQLSchema | undefined;

  constructor(private modulesContainer: ModulesContainer) {
    super(modulesContainer);
  }

  start(options: GqlModuleOptions<any>): Promise<void> {
    let schemaBuilder: InstanceWrapper<SchemaBuilderService> | undefined;
    for (const module of this.modulesContainer.values()) {
      for (const provider of module.providers.values()) {
        if (provider.metatype && Reflect.getMetadata(PothosBuilderKey, provider.metatype)) {
          schemaBuilder = provider as InstanceWrapper<SchemaBuilderService>;
          break;
        }
      }
      if (schemaBuilder) {
        break;
      }
    }
    if (!schemaBuilder) {
      throw Error("Unable to find SchemaBuilderService");
    }
    this.schema = schemaBuilder.instance.toSchema();
    this.logger.log("GraphQL schema loaded");
    this.printSchema();
    return super.start({
      ...options,
      schema: this.schema,
    });
  }

  registerServer(apolloOptions: ApolloDriverConfig): Promise<void> {
    this.sortSchema = apolloOptions.sortSchema;
    delete apolloOptions.sortSchema;
    this.autoSchemaFile = apolloOptions.autoSchemaFile;
    delete apolloOptions.autoSchemaFile;
    this.logger.log("Registering Apollo Server");
    this.printSchema();
    return super.registerServer(apolloOptions);
  }

  private printSchema() {
    if (this.autoSchemaFile && this.schema) {
      const schemaAsString = printSchema(this.sortSchema ? lexicographicSortSchema(this.schema) : this.schema);
      let path = "schema.gql";
      if (typeof this.autoSchemaFile === "string") {
        path = this.autoSchemaFile;
      } else if (typeofObject<SchemaFileConfig>(this.autoSchemaFile)) {
        path = this.autoSchemaFile.path || path;
        if (this.autoSchemaFile.federation) {
          this.logger.warn("GraphQL auto schema file federation option is not supported.");
        }
      }
      const filename = resolve(process.cwd(), path);
      readFile(filename)
        .then(async (current) => {
          const currentAsString = current.toString();
          if (currentAsString !== schemaAsString) {
            await writeFile(filename, schemaAsString)
              .then(async () => {
                this.logger.log(`Updated GraphQL schema file: ${path}`);
                await writeFile(resolve(process.cwd(), "schema.graphql"), schemaAsString).catch(() =>
                  this.logger.warn("Failed to update schema.graphql"),
                );
              })
              .catch((error) => this.logger.warn(error, `Failed to update GraphQL schema file: ${path}`));
          } else {
            this.logger.log(`No changes in GraphQL schema file: ${path}`);
            await writeFile(resolve(process.cwd(), "schema.graphql"), schemaAsString).catch(() =>
              this.logger.warn("Failed to update schema.graphql"),
            );
          }
        })
        .catch(async () => {
          await writeFile(filename, schemaAsString)
            .then(async () => {
              this.logger.log(`Created GraphQL schema file: ${path}`);
              await writeFile(resolve(process.cwd(), "schema.graphql"), schemaAsString).catch(() =>
                this.logger.warn("Failed to update schema.graphql"),
              );
            })
            .catch((error) => this.logger.warn(error, `Failed to create GraphQL schema file: ${path}`));
        });
    }
  }
}
