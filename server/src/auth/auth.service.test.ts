 
import { AuthService, ExpressProvider } from "./auth.service";
import { AppConfigService } from "@/app.config";

function makeConfig(providers: string[] = ["local", "keycloak"]): AppConfigService {
  return {
    auth: { providers, framework: "authjs" },
  } as unknown as AppConfigService;
}

function makeProvider(name: string): ExpressProvider {
  return {
    name,
    label: name,
    credentials: {},
    endpoint: `/auth/${name}/login`,
    validate: jest.fn(),
  };
}

describe("AuthService", () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(makeConfig());
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe("registerProvider()", () => {
    it("registers a provider and notifies subscribers", () => {
      const subscriber = jest.fn();
      service.subscribe(subscriber);
      const provider = makeProvider("local");
      service.registerProvider(provider);
      expect(service.providers.has("local")).toBe(true);
      expect(subscriber).toHaveBeenCalledWith(provider);
    });

    it("overwrites a previously registered provider with the same name", () => {
      const p1 = makeProvider("local");
      const p2 = makeProvider("local");
      service.registerProvider(p1);
      service.registerProvider(p2);
      expect(service.providers.get("local")).toBe(p2);
    });
  });

  describe("getProvider()", () => {
    it("returns the provider when its name is in the allowed list", () => {
      service.registerProvider(makeProvider("local"));
      expect(service.getProvider("local")).toBeDefined();
    });

    it("returns undefined when the provider name is not in the config allow-list", () => {
      service.registerProvider(makeProvider("unknown"));
      expect(service.getProvider("unknown")).toBeUndefined();
    });

    it("returns undefined for a name that was never registered", () => {
      expect(service.getProvider("local")).toBeUndefined();
    });
  });

  describe("getProviderNames()", () => {
    it("returns all registered provider names", () => {
      service.registerProvider(makeProvider("local"));
      service.registerProvider(makeProvider("keycloak"));
      expect(service.getProviderNames()).toEqual(expect.arrayContaining(["local", "keycloak"]));
    });

    it("returns an empty array when no providers are registered", () => {
      expect(service.getProviderNames()).toHaveLength(0);
    });
  });

  describe("subscribe() / unsubscribe()", () => {
    it("subscriber is not called after unsubscribe", () => {
      const subscriber = jest.fn();
      service.subscribe(subscriber);
      service.unsubscribe(subscriber);
      service.registerProvider(makeProvider("local"));
      expect(subscriber).not.toHaveBeenCalled();
    });

    it("multiple subscribers are each notified independently", () => {
      const s1 = jest.fn();
      const s2 = jest.fn();
      service.subscribe(s1);
      service.subscribe(s2);
      service.registerProvider(makeProvider("local"));
      expect(s1).toHaveBeenCalledTimes(1);
      expect(s2).toHaveBeenCalledTimes(1);
    });
  });

  describe("onModuleDestroy()", () => {
    it("clears all registered providers", () => {
      service.registerProvider(makeProvider("local"));
      service.onModuleDestroy();
      expect(service.providers.size).toBe(0);
    });
  });
});
