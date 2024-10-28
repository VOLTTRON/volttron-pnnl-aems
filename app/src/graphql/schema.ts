// import objects
import "./account/object";
import "./banner/object";
import "./comment/object";
import "./log/object";
import "./user/object";
import "./account/object";
import "./feedback/object";
import "./file/object";
// import queries
import "./account/query";
import "./banner/query";
import "./comment/query";
import "./log/query";
import "./user/query";
import "./current/query";
import "./account/query";
import "./feedback/query";
import "./file/query";
// import mutators
import "./account/mutate";
import "./banner/mutate";
import "./comment/mutate";
import "./log/mutate";
import "./user/mutate";
import "./current/mutate";
import "./account/mutate";
import "./feedback/mutate";
import "./file/mutate";
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
    await writeFile(resolve(process.cwd(), "schema.graphql.updated"), new Date().toISOString());
  });
}
