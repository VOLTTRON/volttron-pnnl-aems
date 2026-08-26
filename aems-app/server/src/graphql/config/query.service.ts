import { Inject, Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosQuery } from "../pothos.decorator";
import { AppConfigService } from "@/app.config";

@Injectable()
@PothosQuery()
export class ConfigQuery {
  constructor(
    builder: SchemaBuilderService,
    @Inject(AppConfigService.Key) configService: AppConfigService,
  ) {
    const ServerConfigRef = builder
      .objectRef<{ serviceOverride: boolean; holidaySchedule: boolean; location: string }>("ServerConfig")
      .implement({
        fields: (t) => ({
          serviceOverride: t.exposeBoolean("serviceOverride"),
          holidaySchedule: t.exposeBoolean("holidaySchedule"),
          location: t.exposeString("location"),
        }),
      });

    builder.queryField("readConfig", (t) =>
      t.field({
        description: "Read whitelisted server-side configuration flags.",
        type: ServerConfigRef,
        resolve: () => ({
          serviceOverride: configService.service.config.serviceOverride,
          holidaySchedule: configService.service.config.holidaySchedule,
          location: configService.volttron.timezone,
        }),
      }),
    );
  }
}
