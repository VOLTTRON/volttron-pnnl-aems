// @ts-check

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  output:
    process.env.BUILD_OUTPUT === "standalone"
      ? "standalone"
      : process.env.BUILD_OUTPUT === "export"
      ? "export"
      : undefined,
  ...(process.env.NODE_ENV !== "production" && {
    async headers() {
      return ["/authjs/:path", "/graphql/:path", "/api/:path", "/ext/:path"].map((source) => ({
        source: source,
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      }));
    },
    async rewrites() {
      return [
        {
          source: "/authjs/:path*",
          destination: `${process.env.REWRITE_AUTHJS_URL}/:path*`,
        },
        {
          source: "/graphql/:path*",
          destination: `${process.env.REWRITE_GRAPHQL_URL}/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${process.env.REWRITE_API_URL}/:path*`,
        },
        {
          source: "/ext/:path*",
          destination: `${process.env.REWRITE_EXT_URL}/:path*`,
        },
      ];
    },
  }),
  compiler: {
    styledComponents: true,
  },
  experimental: {
    instrumentationHook: true,
    nextScriptWorkers: true,
    parallelServerCompiles: true,
    parallelServerBuildTraces: true,
    webpackBuildWorker: true,
    workerThreads: true,
    serverComponentsExternalPackages: ["pino", "pino-pretty", "jsonpath"],
  },
};

export default nextConfig;
