import { Prisma } from "@prisma/client";

export interface ServiceOptions {
  schedule: string | undefined;
  service?: string;
  leading?: boolean;
  type?: string;
  proxy?: {
    host: string;
    port: number;
    protocol?: string;
  };
}

export interface ServiceState<T = {}> extends Readonly<ServiceOptions> {
  state: T;
}

export interface Seeder {
  type: "upsert" | "create" | "update" | "delete";
  table: Prisma.TypeMap["meta"]["modelProps"];
  id: string;
  data: Record<string, any>[];
}
