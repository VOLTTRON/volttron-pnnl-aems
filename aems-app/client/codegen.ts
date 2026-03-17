import type { CodegenConfig } from "@graphql-codegen/cli";
import "@local/common";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  documents: ["src/**/*.{ts,tsx,graphql}"],
  ignoreNoDocuments: true,
  generates: {
    "./src/graphql-codegen/": {
      preset: "client",
      config: {
        strictScalars: true,
        scalars: {
          DateTime: "string",
          Json: "any",
          EventPayload: "PrismaJson.EventPayload",
          UserPreferences: "PrismaJson.UserPreferences",
          SessionData: "PrismaJson.SessionData",
          GeographyGeoJson: "PrismaJson.GeographyGeoJson",
          ChangeData: "PrismaJson.ChangeData",
          AccountGroupBy: "PrismaJson.AccountGroupBy",
          BannerGroupBy: "PrismaJson.BannerGroupBy",
          CommentGroupBy: "PrismaJson.CommentGroupBy",
          FeedbackGroupBy: "PrismaJson.FeedbackGroupBy",
          FileGroupBy: "PrismaJson.FileGroupBy",
          GeographyGroupBy: "PrismaJson.GeographyGroupBy",
          LogGroupBy: "PrismaJson.LogGroupBy",
          UserGroupBy: "PrismaJson.UserGroupBy",
          HolidayGroupBy: "PrismaJson.HolidayGroupBy",
          LocationGroupBy: "PrismaJson.LocationGroupBy",
          OccupancyGroupBy: "PrismaJson.OccupancyGroupBy",
          ScheduleGroupBy: "PrismaJson.ScheduleGroupBy",
          SetpointGroupBy: "PrismaJson.SetpointGroupBy",
          UnitGroupBy: "PrismaJson.UnitGroupBy",
          ControlGroupBy: "PrismaJson.ControlGroupBy",
          ChangeGroupBy: "PrismaJson.ChangeGroupBy",
          ConfigurationGroupBy: "PrismaJson.ConfigurationGroupBy",
          HistorianDataPoint: "PrismaJson.HistorianDataPoint",
          HistorianTimeSeries: "PrismaJson.HistorianTimeSeries",
          HistorianAggregate: "PrismaJson.HistorianAggregate",
          HistorianMetricCurrent: "PrismaJson.HistorianMetricCurrent",
          HistorianMultiUnitData: "PrismaJson.HistorianMultiUnitData",
          HistorianReplicationInfo: "@local/common#HistorianReplicationInfo",
          PublisherInfo: "@local/common#PublisherInfo",
          SubscriberSetupSql: "@local/common#SubscriberSetupSql",
          MonitoringSql: "@local/common#MonitoringSql",
          ReplicationSlot: "@local/common#ReplicationSlot",
          UnitPublishingStatus: "@local/common#UnitPublishingStatus",
        },
      },
    },
  },
};

export default config;
