import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { ModulesContainer } from "@nestjs/core";
import type { GqlModuleOptions } from "@nestjs/graphql";
export declare class PothosApolloDriver extends ApolloDriver {
    private modulesContainer;
    private logger;
    private sortSchema;
    private autoSchemaFile;
    private schema;
    constructor(modulesContainer: ModulesContainer);
    start(options: GqlModuleOptions<any>): Promise<void>;
    registerServer(apolloOptions: ApolloDriverConfig): Promise<void>;
    private printSchema;
}
