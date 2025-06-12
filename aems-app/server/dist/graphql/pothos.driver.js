"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PothosApolloDriver_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PothosApolloDriver = void 0;
const apollo_1 = require("@nestjs/apollo");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const pothos_decorator_1 = require("./pothos.decorator");
const graphql_1 = require("graphql");
const node_path_1 = require("node:path");
const common_2 = require("@local/common");
const promises_1 = require("node:fs/promises");
let PothosApolloDriver = PothosApolloDriver_1 = class PothosApolloDriver extends apollo_1.ApolloDriver {
    constructor(modulesContainer) {
        super(modulesContainer);
        this.modulesContainer = modulesContainer;
        this.logger = new common_1.Logger(PothosApolloDriver_1.name);
    }
    start(options) {
        let schemaBuilder;
        for (const module of this.modulesContainer.values()) {
            for (const provider of module.providers.values()) {
                if (provider.metatype && Reflect.getMetadata(pothos_decorator_1.PothosBuilderKey, provider.metatype)) {
                    schemaBuilder = provider;
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
    registerServer(apolloOptions) {
        this.sortSchema = apolloOptions.sortSchema;
        delete apolloOptions.sortSchema;
        this.autoSchemaFile = apolloOptions.autoSchemaFile;
        delete apolloOptions.autoSchemaFile;
        this.logger.log("Registering Apollo Server");
        this.printSchema();
        return super.registerServer(apolloOptions);
    }
    printSchema() {
        if (this.autoSchemaFile && this.schema) {
            const schemaAsString = (0, graphql_1.printSchema)(this.sortSchema ? (0, graphql_1.lexicographicSortSchema)(this.schema) : this.schema);
            let path = "schema.gql";
            if (typeof this.autoSchemaFile === "string") {
                path = this.autoSchemaFile;
            }
            else if ((0, common_2.typeofObject)(this.autoSchemaFile)) {
                path = this.autoSchemaFile.path || path;
                if (this.autoSchemaFile.federation) {
                    this.logger.warn("GraphQL auto schema file federation option is not supported.");
                }
            }
            const filename = (0, node_path_1.resolve)(process.cwd(), path);
            (0, promises_1.readFile)(filename)
                .then(async (current) => {
                const currentAsString = current.toString();
                if (currentAsString !== schemaAsString) {
                    await (0, promises_1.writeFile)(filename, schemaAsString)
                        .then(async () => {
                        this.logger.log(`Updated GraphQL schema file: ${path}`);
                        await (0, promises_1.writeFile)((0, node_path_1.resolve)(process.cwd(), "schema.graphql"), schemaAsString).catch(() => this.logger.warn("Failed to update schema.graphql"));
                    })
                        .catch((error) => this.logger.warn(error, `Failed to update GraphQL schema file: ${path}`));
                }
                else {
                    this.logger.log(`No changes in GraphQL schema file: ${path}`);
                    await (0, promises_1.writeFile)((0, node_path_1.resolve)(process.cwd(), "schema.graphql"), schemaAsString).catch(() => this.logger.warn("Failed to update schema.graphql"));
                }
            })
                .catch(async () => {
                await (0, promises_1.writeFile)(filename, schemaAsString)
                    .then(async () => {
                    this.logger.log(`Created GraphQL schema file: ${path}`);
                    await (0, promises_1.writeFile)((0, node_path_1.resolve)(process.cwd(), "schema.graphql"), schemaAsString).catch(() => this.logger.warn("Failed to update schema.graphql"));
                })
                    .catch((error) => this.logger.warn(error, `Failed to create GraphQL schema file: ${path}`));
            });
        }
    }
};
exports.PothosApolloDriver = PothosApolloDriver;
exports.PothosApolloDriver = PothosApolloDriver = PothosApolloDriver_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.ModulesContainer])
], PothosApolloDriver);
//# sourceMappingURL=pothos.driver.js.map