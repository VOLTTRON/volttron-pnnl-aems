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

/** The agent accepted the call but returned `false`, its signal that the payload was rejected. */
export class AgentFailureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgentFailureError";
  }
}

/**
 * Client for the VOLTTRON web service.
 *
 * Authentication uses `POST /authenticate`. Agent RPC uses the VOLTTRON User Interface (VUI) API:
 * `POST /vui/platforms/:platform/agents/:vip_identity/rpc/:method` with the RPC keyword arguments
 * as the JSON body and the access token as a bearer header. The response body is the raw RPC
 * return value. The former `/gs` JSON-RPC gateway is restricted to VOLTTRON Central's own
 * read-only calls (monolithic) or removed (modular) and can no longer reach application agents.
 */
@Injectable()
export class VolttronService implements OnModuleDestroy {
  private logger = new Logger(VolttronService.name);
  private readonly agent: Agent;
  private readonly maxRetries = 3;

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {
    // Create a single Agent instance with connection pooling enabled
    this.agent = new Agent({
      connect: { keepAlive: true, ca: this.configService.volttron.ca },
      connectTimeout: this.configService.service.config.timeout,
    });
  }

  onModuleDestroy() {
    // Clean up the agent when the module is destroyed
    this.agent.destroy().catch((error: Error) => {
      this.logger.error(`Failed to destroy VolttronService agent:`, error);
    });
  }

  /**
   * Base URL of the VOLTTRON web service, without a trailing slash. A legacy value that still
   * names the retired `/gs` gateway is accepted, with a warning, so an un-migrated deployment
   * keeps working.
   */
  private baseUrl(): string {
    let url = (this.configService.service.config.apiUrl ?? "").trim().replace(/\/+$/, "");
    if (/\/gs$/i.test(url)) {
      url = url.replace(/\/gs$/i, "");
      this.logger.warn(
        `SERVICE_CONFIG_API_URL still ends in "/gs". That gateway no longer forwards agent RPC; using "${url}" as the VOLTTRON web service base URL instead.`,
      );
    }
    return url;
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

  async makeAuthCall(): Promise<string> {
    if (this.configService.volttron.mocked) {
      this.logger.log("Mocked Volttron Auth call");
      return "mocked_access_token";
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
    return json.access_token;
  }

  /**
   * Call `method` on the agent with VIP identity `id`, passing `data` as the method's single
   * keyword argument. Resolves to the RPC return value. Rejects if VOLTTRON refuses or fails
   * the call, or if the agent reports failure by returning `false`.
   */
  async makeApiCall(id: string, method: string, token: string, data: any): Promise<any> {
    if (this.configService.volttron.mocked) {
      this.logger.log(`Mocked Volttron API call: ${method}\nData: ${inspect(data)}`);
      return true;
    }

    // Use retry logic for API calls
    return this.makeApiCallWithRetry(id, method, token, data);
  }

  /** Only transient failures are retried: network errors and 5xx responses. */
  private isRetryable(error: unknown): boolean {
    if (error instanceof VolttronHttpError) {
      return error.status >= 500;
    }
    return !(error instanceof AgentFailureError);
  }

  private async makeApiCallWithRetry(id: string, method: string, token: string, data: any, attempt = 0): Promise<any> {
    const url = this.rpcUrl(id, method);
    const body = { data: data };

    try {
      if (this.configService.service.config.verbose) {
        this.logger.log(inspect({ url: url, body: body }, undefined, 10));
      }

      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        dispatcher: this.agent,
      });

      const result: any = await this.parseJsonResponseOrThrow(response, `Volttron API ${method}`);

      if (this.configService.service.config.verbose) {
        this.logger.log(inspect({ url: url, response: result }, undefined, 10));
      }

      if (result === false) {
        throw new AgentFailureError(`Failed Volttron API ${method} call: agent ${id} reported failure.`);
      }

      return result;
    } catch (error: unknown) {
      const isLastAttempt = attempt >= this.maxRetries - 1;

      if (isLastAttempt || !this.isRetryable(error)) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffMs = Math.pow(2, attempt) * 1000;
      this.logger.warn(
        `API call ${method} failed (attempt ${attempt + 1}/${this.maxRetries}): ${error instanceof Error ? error.message : String(error)}. Retrying in ${backoffMs}ms...`,
      );

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return this.makeApiCallWithRetry(id, method, token, data, attempt + 1);
    }
  }
}
