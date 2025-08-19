import { OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { Credentials, ProviderInfo } from "@local/common";
import { Provider } from "@auth/core/providers";
export type ExpressProvider = ProviderInfo<Credentials> & {
    validate(...args: unknown[]): unknown;
};
export type AuthjsProvider = ProviderInfo<Credentials> & {
    create(): Provider;
};
export declare class AuthService implements OnModuleDestroy {
    private configService;
    private logger;
    readonly providers: Map<string, ExpressProvider | AuthjsProvider>;
    private subscribers;
    constructor(configService: AppConfigService);
    private notifySubscribers;
    subscribe: (subscriber: (provider: ExpressProvider | AuthjsProvider) => void) => void;
    unsubscribe: (subscriber: (provider: ExpressProvider | AuthjsProvider) => void) => void;
    registerProvider: (provider: ExpressProvider | AuthjsProvider) => void;
    getProviderNames: () => string[];
    getProvider: (name: string) => ExpressProvider | AuthjsProvider | undefined;
    onModuleDestroy(): void;
}
