import { Inject, Injectable, Logger } from "@nestjs/common";
import { BaseService } from "..";
import { PrismaService } from "@/prisma/prisma.service";
import { AppConfigService } from "@/app.config";
import { Cron } from "@nestjs/schedule";
import { Mutation, StageType, typeofObject } from "@local/common";
import { VolttronService } from "../volttron.service";
import { renderControlTemplates } from "@/utils/render-control-templates";
import { collectRenderErrors } from "@/utils/template";
import { SubscriptionService } from "@/subscription/subscription.service";

@Injectable()
export class ControlService extends BaseService {
  private logger = new Logger(ControlService.name);

  constructor(
    private prismaService: PrismaService,
    private subscriptionService: SubscriptionService,
    @Inject(AppConfigService.Key) private configService: AppConfigService,
    private volttronService: VolttronService,
  ) {
    super("control", configService);
  }

  @Cron(`*/10 * * * * *`)
  execute(): Promise<void> {
    return super.execute();
  }

  async task() {
    this.logger.debug(`Checking for intelligent load controls that need to be pushed...`);
    try {
      // Create: setup makes a control in that stage, and a new control is pushed without an edit.
      const pending = [StageType.Create.enum, StageType.Update.enum, StageType.Process.enum];
      await this.prismaService.prisma.control
        .findMany({
          select: { id: true },
          orderBy: {
            createdAt: "desc",
          },
          where: { stage: { in: pending } },
        })
        .then(async (listed) => {
          if (listed.length === 0) {
            return;
          }
          const token = await this.volttronService.makeAuthCall();
          for (const { id } of listed) {
            // Claimed only from a pending stage, then read as it stands: an edit saved from here on
            // moves it back to Update, and the conditional writes below leave it there.
            const claimed = await this.prismaService.prisma.control.updateMany({
              where: { id, stage: { in: pending } },
              data: { stage: StageType.ProcessType.enum, message: null },
            });
            if (claimed.count === 0) continue;
            const control = await this.prismaService.prisma.control.findUnique({
              where: { id },
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
            });
            if (!control) continue;
            this.logger.log(`Pushing the control config for: ${control.label}`);
            try {
              // Only what takes part in grid services goes to the ILC agent.
              control.units = control.peakLoadExclude ? [] : control.units.filter((unit) => !unit.peakLoadExclude);
              await this.subscriptionService.publish("Control", {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              await this.subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              const data = await renderControlTemplates(
                control,
                this.configService.service.control.templatePaths,
                this.logger,
              );
              const renderErrors = collectRenderErrors(data);
              if (renderErrors.length > 0) {
                throw new Error(
                  `Template render failed with ${renderErrors.length} error(s): ` +
                    renderErrors.map((e) => `[${e.phase}] ${e._error}`).join("; "),
                );
              }
              await this.volttronService.makeApiCall(`agent.ilc`, "update_configurations", token, data);
              await this.prismaService.prisma.control.updateMany({
                where: { id: control.id, stage: StageType.Process.enum },
                data: { stage: StageType.CompleteType.enum },
              });
              await this.subscriptionService.publish("Control", {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              await this.subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              this.logger.log(`Finished pushing the control config for: ${control.label}`);
            } catch (error: any) {
              this.logger.warn(error, `Failed to push the control config for: ${control.label}`);
              let message = typeofObject<Error>(error, (e) => "message" in e)
                ? error.message
                : "Unknown error occurred while pushing control config.";
              message = message.length > 1024 ? message.substring(0, 1024 - 3) + "..." : message;
              await this.prismaService.prisma.control.updateMany({
                where: { id: control.id, stage: StageType.Process.enum },
                data: { stage: StageType.FailType.enum, message: message },
              });
              await this.subscriptionService.publish("Control", {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
              });
              await this.subscriptionService.publish(`Control/${control.id}`, {
                topic: "Control",
                id: control.id,
                mutation: Mutation.Updated,
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
