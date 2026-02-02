/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AppConfigService } from "@/app.config";
import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { inspect } from "node:util";
import { Agent, fetch } from "undici";

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
    this.agent.destroy();
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
    const json: any = await response.json();
    if (typeof json?.access_token !== "string") {
      throw new Error(`Failed Volttron Auth call: ${inspect(json)}`);
    }
    return json.access_token;
  }

  async makeApiCall(id: string, method: string, token: string, data: any) {
    if (this.configService.volttron.mocked) {
      this.logger.log(`Mocked Volttron API call: ${method}`);
      return { jsonrpc: "2.0", id: id, result: {} };
    }

    // Use retry logic for API calls
    return this.makeApiCallWithRetry(id, method, token, data);
  }

  private async makeApiCallWithRetry(id: string, method: string, token: string, data: any, attempt = 0): Promise<any> {
    const body = {
      jsonrpc: "2.0",
      id: id,
      method: method,
      params: {
        authentication: token,
        data: data,
      },
    };

    try {
      if (this.configService.service.config.verbose) {
        this.logger.log(inspect({ url: this.configService.service.config.apiUrl, body: body }, undefined, 10));
      }

      const response = await fetch(`${this.configService.service.config.apiUrl}`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        dispatcher: this.agent,
      });

      const json: any = await response.json();

      if (this.configService.service.config.verbose) {
        this.logger.log(inspect({ url: this.configService.service.config.apiUrl, response: json }, undefined, 10));
      }

      if (typeof json?.result === "string") {
        throw new Error(`Failed Volttron API ${method} call: ${inspect(json)}`);
      } else if (!json?.result) {
        throw new Error(`Failed Volttron API ${method} call.`);
      }

      return json;
    } catch (error: unknown) {
      const isLastAttempt = attempt >= this.maxRetries - 1;

      // Don't retry authentication errors or if we've exhausted retries
      if (isLastAttempt || (error instanceof Error && error.message.includes("Auth"))) {
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
