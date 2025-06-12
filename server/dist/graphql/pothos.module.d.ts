import { DynamicModule, MiddlewareConsumer } from "@nestjs/common";
export declare class PothosGraphQLModule {
    static forRoot(): DynamicModule;
    configure(consumer: MiddlewareConsumer): void;
}
