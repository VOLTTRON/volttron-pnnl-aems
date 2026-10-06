import { readFileSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

const docker = join(__dirname, "..", "..", "..", "docker");

interface ComposeService {
  hostname?: string;
  profiles?: string[];
  command?: string | string[];
  expose?: (string | number)[];
}

const services = Object.entries(
  (parse(readFileSync(join(docker, "docker-compose.yml"), "utf-8")) as { services: Record<string, ComposeService> })
    .services,
);

const authorized = readFileSync(join(docker, ".env.server"), "utf-8")
  .split(/\r?\n/)
  .map((line) => /^(EXT_\w+_AUTHORIZED)=(.*)$/.exec(line.trim()))
  .filter((match): match is RegExpExecArray => match !== null)
  .map(([, key, value]) => ({ key, url: new URL(value) }));

/** The ports a service says it listens on: a `--port` argument, then anything under `expose:`. */
function declaredPorts(service: ComposeService): string[] {
  const command = Array.isArray(service.command) ? service.command : (service.command?.split(/\s+/) ?? []);
  const flag = command.indexOf("--port");
  return [
    ...(flag >= 0 && command[flag + 1] ? [String(command[flag + 1])] : []),
    ...(service.expose ?? []).map((port) => String(port).split("/")[0]),
  ];
}

// scenario: ext-targets-match-compose
describe("the /ext/ authorized targets", () => {
  it("cover the map, Nominatim and the wiki", () => {
    expect(authorized.map(({ key }) => key).sort()).toEqual([
      "EXT_MAP_AUTHORIZED",
      "EXT_NOMINATIM_AUTHORIZED",
      "EXT_WIKI_AUTHORIZED",
    ]);
  });

  for (const { key, url } of authorized) {
    describe(key, () => {
      const matching = services.filter(([, service]) => service.hostname === url.hostname);

      it(`names the hostname of exactly one compose service (${url.hostname})`, () => {
        expect(matching.map(([name]) => name)).toHaveLength(1);
      });

      it("names a service that only a profile starts", () => {
        const [[, service]] = matching;
        expect(service.profiles ?? []).not.toHaveLength(0);
      });

      it("names the port that service declares it listens on", () => {
        const [[name, service]] = matching;
        const port = url.port || (url.protocol === "https:" ? "443" : "80");
        expect({ service: name, declared: declaredPorts(service) }).toEqual({
          service: name,
          declared: expect.arrayContaining([port]) as string[],
        });
      });
    });
  }
});
