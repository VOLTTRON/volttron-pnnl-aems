import { Inject, Injectable, Logger } from "@nestjs/common";
import { Control } from "@prisma/client";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Agent, fetch } from "undici";
import { inspect } from "node:util";
import { Cron } from "@nestjs/schedule";
import { StageType } from "@local/common";
import { transformTemplate } from "@/utils/template";
import { basename, extname, resolve } from "node:path";
import { readdir, readFile, stat } from "node:fs/promises";

@Injectable()
export class ControlService extends BaseService {
  private logger = new Logger(ControlService.name);

  constructor(
    private prismaService: PrismaService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
  ) {
    super("control", configService);
  }

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

  async makeApiCall(control: Control, method: string, token: string, data: any) {
    const body = {
      jsonrpc: "2.0",
      id: `agent.ilc`,
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

  async getTemplateFiles(paths: string[]) {
    const files: string[] = [];
    for (const path of paths) {
      const file = resolve(process.cwd(), path);
      const dirent = await stat(file);
      if (dirent.isFile()) {
        if (extname(file) === ".json") {
          files.push(file);
        }
      } else if (dirent.isDirectory()) {
        files.push(...(await this.getTemplateFiles(await readdir(file))));
      } else {
        this.logger.warn(`Skipping non-file and non-directory: ${file}`);
      }
    }
    return files;
  }

  @Cron(`*/10 * * * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.debug(`Checking for intelligent load controls that need to be pushed...`);
    try {
      await this.prismaService.prisma.control
        .findMany({
          include: {
            units: {
              include: {
                configuration: {
                  include: {
                    setpoint: true,
                    mondaySchedule: true,
                    tuesdaySchedule: true,
                    wednesdaySchedule: true,
                    thursdaySchedule: true,
                    fridaySchedule: true,
                    saturdaySchedule: true,
                    sundaySchedule: true,
                    holidaySchedule: true,
                    holidays: true,
                    occupancies: { include: { schedule: true } },
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          where: { stage: { in: [StageType.Update.enum, StageType.Process.enum] } },
        })
        .then(async (controls) => {
          const token = await this.makeAuthCall();
          for (const control of controls) {
            this.logger.log(`Pushing the control config for: ${control.label}`);
            try {
              if (control.peakLoadExclude) {
                control.units = [];
              }
              await this.prismaService.prisma.control.update({
                where: { id: control.id },
                data: { stage: StageType.ProcessType.enum, message: null },
              });
              const data: Record<string, any> = {};
              for (const file of await this.getTemplateFiles(this.configService.service.control.templatePaths)) {
                const key = basename(file, extname(file));
                const text = await readFile(file, "utf-8");
                const template = control.units ? JSON.parse(text) : {};
                data[key] = transformTemplate(template, control);
              }
              await this.makeApiCall(control, "update_configurations", token, data);
              await this.prismaService.prisma.control.update({
                where: { id: control.id },
                data: { stage: StageType.CompleteType.enum },
              });
              this.logger.log(`Finished pushing the control config for: ${control.label}`);
            } catch (err) {
              this.logger.warn(err, `Failed to push the control config for: ${control.label}`);
              let message = ((err as any)?.message as string) || "Unknown error occurred while pushing control config.";
              message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
              await this.prismaService.prisma.control.update({
                where: { id: control.id },
                data: { stage: StageType.FailType.enum, message: message },
              });
            }
          }
        })
        .catch((err) => this.logger.warn(err));
    } catch (error) {
      this.logger.warn(error);
    }
    this.logger.debug(`Finished pushing control configs.`);
  }
}
