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
          DateTime: "@/graphql/types#DateType",
          Event: "@/graphql/types#SubscriptionEventType",
          Preferences: "@/graphql/types#UserPreferencesType",
          LogType: "@/graphql/types#LogType",
          FeedbackStatusType: "@/graphql/types#FeedbackStatusType",
        },
      },
    },
  },
};

export default config;
