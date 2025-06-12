import type { CodegenConfig } from "@graphql-codegen/cli";

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
          AccountGroupBy: "PrismaJson.AccountGroupBy",
          BannerGroupBy: "PrismaJson.BannerGroupBy",
          CommentGroupBy: "PrismaJson.CommentGroupBy",
          FeedbackGroupBy: "PrismaJson.FeedbackGroupBy",
          FileGroupBy: "PrismaJson.FileGroupBy",
          GeographyGroupBy: "PrismaJson.GeographyGroupBy",
          LogGroupBy: "PrismaJson.LogGroupBy",
          UserGroupBy: "PrismaJson.UserGroupBy",
        },
      },
    },
  },
};

export default config;
