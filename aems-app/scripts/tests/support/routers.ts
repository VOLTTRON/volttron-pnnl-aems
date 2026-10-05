import { APIRequestContext } from "@playwright/test";
import { hostname, run } from "./stack";

/** A URL each Traefik router answers, by router name. A router with no entry here fails `routers`. */
const PROBES: Record<string, string> = {
  client: "https://{host}/",
  "client-http": "http://{host}/",
  server: "https://{host}/graphql",
  "server-http": "http://{host}/graphql",
  keycloak: "https://{host}/auth/sso/realms/default/.well-known/openid-configuration",
  "keycloak-http": "http://{host}/auth/sso/realms/default/.well-known/openid-configuration",
  "keycloak-admin": "https://{host}/auth/sso/admin/",
  grafana: "https://{host}/grafana/login",
  "grafana-http": "http://{host}/grafana/login",
};

type Config = { services: Record<string, { labels?: Record<string, string> }> };

/** Every HTTP router the running stack's compose config declares, with the URL that probes it. */
export function routers(env: NodeJS.ProcessEnv = process.env): { name: string; url: string }[] {
  const config = JSON.parse(run("docker", ["compose", "config", "--format", "json"], { env: { ...env, MSYS_NO_PATHCONV: "1" } })) as Config;
  const names = new Set<string>();
  for (const service of Object.values(config.services)) {
    for (const label of Object.keys(service.labels ?? {})) {
      const m = /^traefik\.http\.routers\.([^.]+)\.rule$/.exec(label);
      if (m) names.add(m[1]);
    }
  }
  return [...names].sort().map((name) => {
    const probe = PROBES[name];
    if (!probe) throw new Error(`router '${name}' has no probe in support/routers.ts`);
    return { name, url: probe.replace("{host}", hostname) };
  });
}

/** The response headers ROUTER sends, without following its redirect. */
export async function headersOn(request: APIRequestContext, url: string): Promise<Record<string, string>> {
  return (await request.get(url, { maxRedirects: 0 })).headers();
}
