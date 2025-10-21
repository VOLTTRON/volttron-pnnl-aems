import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { AppConfigService } from "@/app.config";
import { Credentials, ProviderInfo } from "@local/common";
import { Provider } from "@auth/core/providers";

export type ExpressProvider = ProviderInfo<Credentials> & { validate(...args: unknown[]): unknown };

export type AuthjsProvider = ProviderInfo<Credentials> & {
  create(): Provider;
};

@Injectable()
export class AuthService implements OnModuleDestroy {
  private logger = new Logger(AuthService.name);
  readonly providers = new Map<string, ExpressProvider | AuthjsProvider>();
  private subscribers: ((provider: ExpressProvider | AuthjsProvider) => void)[] = [];

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {
    this.logger.log("Initializing auth service");
  }

  private notifySubscribers = (provider: ExpressProvider | AuthjsProvider) => {
    this.subscribers.forEach((subscriber) => subscriber(provider));
  };

  subscribe = (subscriber: (provider: ExpressProvider | AuthjsProvider) => void) => {
    this.subscribers.push(subscriber);
  };

  unsubscribe = (subscriber: (provider: ExpressProvider | AuthjsProvider) => void) => {
    this.subscribers = this.subscribers.filter((sub) => sub !== subscriber);
  };

  registerProvider = (provider: ExpressProvider | AuthjsProvider) => {
    this.providers.set(provider.name, provider);
    this.logger.log(`Registered provider: ${provider.name}`);
    this.notifySubscribers(provider);
  };

  getProviderNames = () => Array.from(this.providers.keys());

  getProvider = (name: string): ExpressProvider | AuthjsProvider | undefined => {
    const provider = this.providers.get(name);
    return provider && this.configService.auth.providers.includes(name) ? provider : undefined;
  };

  onModuleDestroy() {
    this.providers.clear();
  }
}
