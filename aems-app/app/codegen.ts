import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "schema.graphql",
  documents: ["src/**/*.{ts,tsx,graphql}"],
  generates: {
    "./src/generated/graphql-codegen/": {
      preset: "client",
      config: {
        strictScalars: true,
        scalars: {
          JSON: "any",
          Preferences: "@/graphql/types#UserPreferencesType",
          Event: "@/graphql/types#SubscriptionEventType",
          DateTime: "Date",
          LogType: "@/graphql/types#LogType",
          FeedbackStatusType: "@/graphql/types#FeedbackStatusType",
        },
      },
    },
  },
};

export default config;
