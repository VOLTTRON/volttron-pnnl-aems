"use client";

import styles from "./page.module.scss";
import { Card } from "@blueprintjs/core";

export default function Page() {
  return (
    <div className={styles.page}>
      <Card>
        <h2>About This Application</h2>
        <p>
          This is a full-stack TypeScript application built with modern web technologies. It demonstrates a complete
          development stack with frontend, backend, and database integration.
        </p>
      </Card>

      <Card>
        <h3>Technology Stack</h3>
        <ul>
          <li>
            <strong>Frontend:</strong> Next.js 14+ with React 18, TypeScript, SCSS, Blueprint.js UI
          </li>
          <li>
            <strong>Backend:</strong> NestJS with GraphQL (Apollo Server), Pothos schema builders
          </li>
          <li>
            <strong>Database:</strong> PostgreSQL + PostGIS with Prisma ORM
          </li>
          <li>
            <strong>Authentication:</strong> Auth.js with optional Keycloak SSO
          </li>
          <li>
            <strong>Maps:</strong> MapLibre GL for geospatial features
          </li>
          <li>
            <strong>Cache:</strong> Redis for sessions and GraphQL subscriptions
          </li>
        </ul>
      </Card>

      <Card>
        <h3>Project Structure</h3>
        <p>
          This is a monorepo with separate modules for client, server, common utilities, and database schema. The build
          order follows dependency requirements: prisma → common → server → client.
        </p>
      </Card>

      <Card>
        <h3>Development</h3>
        <p>
          The application uses Yarn 4.x as the package manager and includes comprehensive tooling for development,
          testing, and deployment. Docker Compose is available for full-stack deployment with optional services like
          proxy, maps, and wiki integration.
        </p>
      </Card>
    </div>
  );
}
