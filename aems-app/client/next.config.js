// @ts-check
import { execSync } from 'child_process';

// Docker hostname detection (only in development mode)
if (process.env.NODE_ENV !== 'production') {
  try {
    // Find server container
    const findServerContainer = () => {
      try {
        const output = execSync('docker ps --format "{{.Names}}" --filter "name=-server"', {
          encoding: 'utf-8',
          stdio: ['pipe', 'pipe', 'pipe']
        });
        const containers = output.trim().split('\n').filter(name => name.endsWith('-server'));
        return containers.length > 0 ? containers[0] : null;
      } catch (error) {
        return null;
      }
    };

    // Extract hostname from container environment
    const getDockerHostname = (/** @type {string} */ containerName) => {
      try {
        const cmd = `docker inspect ${containerName} --format "{{range .Config.Env}}{{println .}}{{end}}"`;
        const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

        // Extract from CORS_ORIGIN
        const corsMatch = output.match(/CORS_ORIGIN=https?:\/\/([^:\s\/]+)/);
        if (corsMatch) return corsMatch[1].trim();

        // Fallback to KEYCLOAK_ISSUER_URL
        const keycloakMatch = output.match(/KEYCLOAK_ISSUER_URL=https?:\/\/([^:\s\/]+)/);
        if (keycloakMatch) return keycloakMatch[1].trim();

        return null;
      } catch (error) {
        return null;
      }
    };

    // Replace hostname in URL and configure for proxy access
    const replaceHostname = (/** @type {string} */ url, /** @type {string} */ newHostname) => {
      try {
        const parsed = new URL(url);
        parsed.protocol = 'https:';  // Use HTTPS for proxy
        parsed.hostname = newHostname;
        parsed.port = '';  // Remove port - proxy handles routing
        return parsed.toString();
      } catch (error) {
        return url;
      }
    };

    // Detect Docker hostname and update environment variables
    const serverContainer = findServerContainer();
    if (serverContainer) {
      const dockerHostname = getDockerHostname(serverContainer);
      
      // Only update if we found a valid hostname (not localhost)
      if (dockerHostname && dockerHostname !== 'localhost') {
        // Update REWRITE_* environment variables with Docker hostname
        if (process.env.REWRITE_AUTHJS_URL) {
          process.env.REWRITE_AUTHJS_URL = replaceHostname(process.env.REWRITE_AUTHJS_URL, dockerHostname);
        }
        if (process.env.REWRITE_GRAPHQL_URL) {
          process.env.REWRITE_GRAPHQL_URL = replaceHostname(process.env.REWRITE_GRAPHQL_URL, dockerHostname);
        }
        if (process.env.REWRITE_API_URL) {
          process.env.REWRITE_API_URL = replaceHostname(process.env.REWRITE_API_URL, dockerHostname);
        }
        if (process.env.REWRITE_EXT_URL) {
          process.env.REWRITE_EXT_URL = replaceHostname(process.env.REWRITE_EXT_URL, dockerHostname);
        }
      }
    }
    // If Docker not found or hostname detection fails, fall back to defaults from .env
  } catch (error) {
    // Silently fail and use defaults from .env
  }
}

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
