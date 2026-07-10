# client/src/app/api/ — Next.js Route Handlers

This directory is reserved for Next.js App Router route handlers (`route.ts` files). **Do not add API routes here for application data** — those belong in the NestJS server.

Any route defined here at `/api/*` will conflict with Traefik's routing rules in production: the proxy forwards all `/api/*` requests to the NestJS server (`skeleton-server:3000`), so a Next.js handler at this path will never be reached from outside the container.

For application data: use the NestJS GraphQL API at `/graphql` (via Apollo Client) or the REST controllers in `server/src/api/`.
