// @ts-check

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  output: "standalone",
  rewrites: async () => {
    return {
      beforeFiles: [
        {
          source: "/",
          destination: "/index.html",
        },
        {
          source: "/api/osm/style.json",
          destination: "/osm/style.json",
        },
      ],
      fallback: [
        {
          source: "/:any",
          destination: "/index.html",
        },
      ],
    };
  },
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
  experimental: {
    nextScriptWorkers: true,
    instrumentationHook: true,
    serverComponentsExternalPackages: ["pino", "pino-pretty", "pino-prisma", "jsonpath"],
  },
  webpack: (config) => {
    config.externals.push("@node-rs/argon2", "@node-rs/bcrypt");
    return config;
  },
};

export default nextConfig;
