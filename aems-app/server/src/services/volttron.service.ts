/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { AppConfigService } from "@/app.config";
import { Inject, Injectable, Logger } from "@nestjs/common";
import { inspect } from "node:util";
import { Agent, fetch } from "undici";

@Injectable()
export class VolttronService {
  private logger = new Logger(VolttronService.name);

  constructor(@Inject(AppConfigService.Key) private configService: AppConfigService) {}

  async makeAuthCall(): Promise<string> {
    const body = {
      username: this.configService.service.config.username,
      password: this.configService.service.config.password,
    };
    const response = await fetch(`${this.configService.service.config.authUrl}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
      dispatcher: new Agent({
        connect: { keepAlive: false, ca: this.configService.volttron.ca },
        connectTimeout: this.configService.service.config.timeout,
      }),
    });
    const json: any = await response.json();
    if (typeof json?.access_token !== "string") {
      throw new Error(`Failed Volttron Auth call: ${inspect(json)}`);
    }
    return json.access_token;
  }

  async makeApiCall(id: string, method: string, token: string, data: any) {
    const body = {
      jsonrpc: "2.0",
      id: id,
      method: method,
      params: {
        authentication: token,
        data: data,
      },
    };
    if (this.configService.service.config.verbose) {
      this.logger.log(inspect({ url: this.configService.service.config.apiUrl, body: body }, undefined, 10));
    }
    const response = await fetch(`${this.configService.service.config.apiUrl}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      dispatcher: new Agent({
        connect: { keepAlive: false, ca: this.configService.volttron.ca },
        connectTimeout: this.configService.service.config.timeout,
      }),
    });
    const json: any = await response.json();
    if (typeof json?.result === "string") {
      throw new Error(`Failed Volttron API ${method} call: ${inspect(json)}`);
    } else if (!json?.result) {
      throw new Error(`Failed Volttron API ${method} call.`);
    }
    return json;
  }
}
