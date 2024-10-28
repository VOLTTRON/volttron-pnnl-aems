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
      return [
        {
          source: "/api/:path*",
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
    serverComponentsExternalPackages: ["pino", "pino-pretty", "pino-prisma", "jsonpath"],
    webpackBuildWorker: true,
    workerThreads: true,
  },
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};

export default nextConfig;
