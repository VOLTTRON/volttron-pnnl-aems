import { createServer, get } from "node:http";
import { parse } from "node:url";
import next from "next";
import { rm, stat } from "fs/promises";
import { resolve } from "node:path";

process.env.CLUSTER_TYPE = "schema";
process.env.LOG_TRANSPORTS = "console";
process.env.GRAPHQL_PUBSUB = "memory";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const ac = new AbortController();
const { signal } = ac;
setTimeout(() => ac.abort(), 60000);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url, true));
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, async () => {
      try {
        const filename = resolve(process.cwd(), "schema.graphql.updated");
        await rm(filename, { force: true });
        get(`http://${hostname}:${port}/api/graphql`);
        console.log("Waiting for 'schema.graphql' to update...");
        while ((await stat(filename).catch(() => null)) === null && !signal.aborted) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        console.log("Graphql schema updated");
        process.exit(0);
      } catch (err) {
        console.log(`Graphql schema failed to update: ${err}`);
        process.exit(1);
      }
    });
});
