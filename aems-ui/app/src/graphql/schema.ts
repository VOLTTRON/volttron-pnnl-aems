// import objects
import "./comments/object";
import "./logs/object";
import "./users/object";
import "./units/object";
import "./configurations/object";
import "./accounts/object";
// import inputs
import "./comments/input";
import "./logs/input";
import "./users/input";
import "./units/input";
import "./configurations/input";
import "./accounts/input";
// import queries
import "./comments/query";
import "./current/query";
import "./logs/query";
import "./users/query";
import "./units/query";
import "./configurations/query";
import "./accounts/query";
// import mutators
import "./comments/mutate";
import "./logs/mutate";
import "./current/mutate";
import "./users/mutate";
import "./units/mutate";
import "./configurations/mutate";
import "./accounts/mutate";

import { builder } from "./builder";
import { lexicographicSortSchema, printSchema } from "graphql";
import { resolve } from "path";
import { readFile, writeFile } from "fs/promises";
import { logger } from "@/logging";

export const schema = builder.toSchema({});

if (process.env.NODE_ENV === "development") {
  const schemaAsString = printSchema(lexicographicSortSchema(schema));
  const filename = resolve(process.cwd(), "schema.graphql");
  readFile(filename).then(async (current) => {
    const currentAsString = current.toString();
    if (currentAsString !== schemaAsString) {
      await writeFile(filename, schemaAsString)
        .then(() => logger.info(`Updated schema.graphql`))
        .catch((error) => logger.warn(error, `Failed to update schema.graphql`));
    }
    await writeFile(resolve(process.cwd(), "schema.graphql.updated"), String(Date.now()));
  });
}
