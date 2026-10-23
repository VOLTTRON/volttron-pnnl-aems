/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AppConfigService } from "@/app.config";
import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { inspect } from "node:util";
import { Agent, fetch } from "undici";

/**
 * An HTTP-level failure from the VOLTTRON web service. Carries the status so the
 * retry loop can tell a transient server error from a request VOLTTRON refused.
 */
export class VolttronHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "VolttronHttpError";
  }
}

/** The agent accepted the call but reported failure (`false` from VUI, missing or string `result` from /gs). */
export class AgentFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentFailureError";
  }
}

/** Which web API the deployed platform serves. Picked once per push by `GET <base>/vui`. */
export type VolttronApi = "vui" | "gs";

/** One push's auth: the access token and the API dispatched to under it. */
export type VolttronSession = { token: string; api: VolttronApi };

/** How logs and errors name an API. */
const apiName = (api: VolttronApi) => (api === "vui" ? "VUI" : "/gs");

@Injectable()
export class VolttronService implements OnModuleDestroy {
  private logger = new Logger(VolttronService.name);
  private readonly agent: Agent;
  private readonly maxRetries = 3;

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {
    this.agent = new Agent({
      connect: { keepAlive: true, ca: this.configService.volttron.ca },
      connectTimeout: this.configService.service.config.timeout,
    });
  }

  onModuleDestroy() {
    this.agent.destroy().catch((error: Error) => {
      this.logger.error(`Failed to destroy VolttronService agent:`, error);
    });
  }

  /** Base URL of the VOLTTRON web service, without a trailing slash or a trailing `/gs`. */
  private baseUrl(): string {
    const url = (this.configService.service.config.apiUrl ?? "").trim().replace(/\/+$/, "");
    return url.replace(/\/gs$/i, "");
  }

  /** URL of the VUI RPC endpoint for one method on one agent of the configured platform. */
  rpcUrl(id: string, method: string): string {
    const platform = encodeURIComponent(this.configService.service.config.platform);
    return `${this.baseUrl()}/vui/platforms/${platform}/agents/${encodeURIComponent(id)}/rpc/${encodeURIComponent(method)}`;
  }

  private async parseJsonResponseOrThrow(
    response: Awaited<ReturnType<typeof fetch>>,
    context: string,
  ): Promise<any> {
    const previewBody = async (): Promise<string> => {
      const text = await response.text().catch(() => "<unreadable body>");
      return text.length > 256 ? `${text.slice(0, 253)}…` : text;
    };
    if (!response.ok) {
      throw new VolttronHttpError(
        `${context}: HTTP ${response.status} ${response.statusText} — ${await previewBody()}`,
        response.status,
      );
    }
    const ct = response.headers.get("content-type") ?? "";
    if (!ct.toLowerCase().includes("application/json")) {
      throw new Error(`${context}: expected JSON, got content-type "${ct}" — ${await previewBody()}`);
    }
    return response.json();
  }

  async makeAuthCall(): Promise<VolttronSession> {
    if (this.configService.volttron.mocked) {
      this.logger.log("Mocked Volttron Auth call");
      return { token: "mocked_access_token", api: "vui" };
    }
    const body = {
      username: this.configService.service.config.username,
      password: this.configService.service.config.password,
    };
    const response = await fetch(`${this.configService.service.config.authUrl}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      dispatcher: this.agent,
    });
    const json: any = await this.parseJsonResponseOrThrow(response, "Volttron auth");
    if (typeof json?.access_token !== "string") {
      throw new Error(`Failed Volttron Auth call: ${inspect(json)}`);
    }
    const token: string = json.access_token;
    const api = await this.detectApi(token);
    return { token, api };
  }

  /** `GET <base>/vui` once: 2xx → VUI, 404 → `/gs`, any other answer fails the push. */
  private async detectApi(token: string): Promise<VolttronApi> {
    const url = `${this.baseUrl()}/vui`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      dispatcher: this.agent,
    });
    if (response.ok || response.status === 404) {
      const api: VolttronApi = response.ok ? "vui" : "gs";
      this.logger.log(`Volttron push through ${apiName(api)} at ${this.baseUrl()}`);
      return api;
    }
    throw new VolttronHttpError(
      `Volttron API detection ${url}: HTTP ${response.status} ${response.statusText}`,
      response.status,
    );
  }

  /**
   * Call `method` on the agent with VIP identity `id`, dispatching through the API named by
   * `session`. The payload travels as `data`: for VUI as the method's keyword argument, for /gs
   * inside the JSON-RPC `params` alongside the access token. Resolves to the RPC return value.
   * Rejects if VOLTTRON refuses or fails the call, or if the agent reports failure (`false` from
   * VUI, missing or string `result` from /gs).
   */
  async makeApiCall(id: string, method: string, session: VolttronSession, data: any): Promise<any> {
    if (this.configService.volttron.mocked) {
      this.logger.log(`Mocked Volttron API call: ${method}\nData: ${inspect(data)}`);
      return true;
    }
    return this.makeApiCallWithRetry(id, method, session, data);
  }

  /** Only transient failures are retried: network errors and 5xx responses. */
  private isRetryable(error: unknown): boolean {
    if (error instanceof VolttronHttpError) {
      return error.status >= 500;
    }
    return !(error instanceof AgentFailureError);
  }

  private async makeApiCallWithRetry(
    id: string,
    method: string,
    session: VolttronSession,
    data: any,
    attempt = 0,
  ): Promise<any> {
    const url = session.api === "vui" ? this.rpcUrl(id, method) : `${this.baseUrl()}/gs`;
    const body =
      session.api === "vui"
        ? { data: data }
        : {
            jsonrpc: "2.0",
            id: id,
            method: method,
            params: { authentication: session.token, data: data },
          };
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session.api === "vui") headers.Authorization = `Bearer ${session.token}`;
    const name = apiName(session.api);

    try {
      if (this.configService.service.config.verbose) {
        // The /gs body carries the access token; no log line may.
        const logged = "params" in body ? { ...body, params: { ...body.params, authentication: "<redacted>" } } : body;
        this.logger.log(inspect({ url: url, body: logged }, undefined, 10));
      }

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: headers,
        dispatcher: this.agent,
      });

      if (session.api === "gs" && response.status === 404) {
        throw new VolttronHttpError(
          `Volttron platform at ${this.baseUrl()} serves neither API: ${this.baseUrl()}/vui and ${url} both answered 404`,
          404,
        );
      }

      const parsed: any = await this.parseJsonResponseOrThrow(response, `Volttron ${name} API ${method}`);

      if (this.configService.service.config.verbose) {
        this.logger.log(inspect({ url: url, response: parsed }, undefined, 10));
      }

      if (session.api === "vui") {
        if (parsed === false) {
          throw new AgentFailureError(`Failed Volttron ${name} API ${method} call: agent ${id} reported failure.`);
        }
        return parsed;
      }

      if (!parsed || !("result" in parsed) || typeof parsed.result === "string") {
        throw new AgentFailureError(`Failed Volttron ${name} API ${method} call: agent ${id} reported failure.`);
      }
      return parsed.result;
    } catch (error: unknown) {
      const isLastAttempt = attempt >= this.maxRetries - 1;

      if (isLastAttempt || !this.isRetryable(error)) {
        throw error;
      }

      const backoffMs = Math.pow(2, attempt) * 1000;
      this.logger.warn(
        `API call ${method} failed (attempt ${attempt + 1}/${this.maxRetries}): ${error instanceof Error ? error.message : String(error)}. Retrying in ${backoffMs}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return this.makeApiCallWithRetry(id, method, session, data, attempt + 1);
    }
  }
}
