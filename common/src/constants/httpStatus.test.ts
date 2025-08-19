import { HttpStatusType } from "../";
import { HttpStatusEnum } from ".";

describe("constants.HttpStatusType", () => {
  describe("HttpStatusType.parse()", () => {
    it("(ok) is ok", () => {
      expect(HttpStatusType.parse("ok")?.name).toEqual("ok");
    });
    it("(OK) is ok", () => {
      expect(HttpStatusType.parse("OK")?.name).toEqual("ok");
    });
    it("(not-found) is not-found", () => {
      expect(HttpStatusType.parse("not-found")?.name).toEqual("not-found");
    });
    it("(Not Found) is not-found", () => {
      expect(HttpStatusType.parse("Not Found")?.name).toEqual("not-found");
    });
    it("(object with name) is parsed correctly", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(HttpStatusType.parse({ name: "ok" } as any)?.name).toEqual("ok");
    });
    it("(invalid string) is undefined", () => {
      expect(HttpStatusType.parse("invalid-status")).toBeUndefined();
    });
    it("(invalid number) is undefined", () => {
      expect(HttpStatusType.parse(999)).toBeUndefined();
    });
  });

  describe("HttpStatusType.parseStrict()", () => {
    it("(ok) is ok", () => {
      expect(HttpStatusType.parseStrict("ok")?.name).toEqual("ok");
    });
    it("(not-found) is not-found", () => {
      expect(HttpStatusType.parseStrict("not-found")?.name).toEqual("not-found");
    });
    it("(invalid string) throws Error", () => {
      expect(() => HttpStatusType.parseStrict("invalid-status")).toThrow(Error);
    });
    it("(invalid number) throws Error", () => {
      expect(() => HttpStatusType.parseStrict(999)).toThrow(Error);
    });
    it("(null) throws Error", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => HttpStatusType.parseStrict(null as any)).toThrow(Error);
    });
    it("(undefined) throws Error", () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => HttpStatusType.parseStrict(undefined as any)).toThrow(Error);
    });
  });

  describe("HttpStatusType static references", () => {
    it("OK should have correct properties", () => {
      expect(HttpStatusType.OK.name).toEqual("ok");
      expect(HttpStatusType.OK.status).toEqual(200);
      expect(HttpStatusType.OK.enum).toEqual(HttpStatusEnum.Success);
      expect(HttpStatusType.OK.statusText).toEqual("OK");
    });
    it("NotFound should have correct properties", () => {
      expect(HttpStatusType.NotFound.name).toEqual("not-found");
      expect(HttpStatusType.NotFound.status).toEqual(404);
      expect(HttpStatusType.NotFound.enum).toEqual(HttpStatusEnum.ClientError);
      expect(HttpStatusType.NotFound.statusText).toEqual("Not Found");
    });
    it("InternalServerError should have correct properties", () => {
      expect(HttpStatusType.InternalServerError.name).toEqual("internal-server-error");
      expect(HttpStatusType.InternalServerError.status).toEqual(500);
      expect(HttpStatusType.InternalServerError.enum).toEqual(HttpStatusEnum.ServerError);
      expect(HttpStatusType.InternalServerError.statusText).toEqual("Internal Server Error");
    });
    it("ImATeapot should have correct properties", () => {
      expect(HttpStatusType.ImATeapot.name).toEqual("im-a-teapot");
      expect(HttpStatusType.ImATeapot.status).toEqual(418);
      expect(HttpStatusType.ImATeapot.enum).toEqual(HttpStatusEnum.ClientError);
      expect(HttpStatusType.ImATeapot.statusText).toEqual("I'm a teapot");
    });
  });

  describe("HttpStatusType edge cases", () => {
    it("should handle all information status codes", () => {
      expect(HttpStatusType.Continue.enum).toEqual(HttpStatusEnum.Information);
      expect(HttpStatusType.SwitchingProtocols.enum).toEqual(HttpStatusEnum.Information);
      expect(HttpStatusType.Processing.enum).toEqual(HttpStatusEnum.Information);
      expect(HttpStatusType.EarlyHints.enum).toEqual(HttpStatusEnum.Information);
    });
    it("should handle all success status codes", () => {
      expect(HttpStatusType.OK.enum).toEqual(HttpStatusEnum.Success);
      expect(HttpStatusType.Created.enum).toEqual(HttpStatusEnum.Success);
      expect(HttpStatusType.Accepted.enum).toEqual(HttpStatusEnum.Success);
      expect(HttpStatusType.NoContent.enum).toEqual(HttpStatusEnum.Success);
    });
    it("should handle all redirect status codes", () => {
      expect(HttpStatusType.MultipleChoices.enum).toEqual(HttpStatusEnum.Redirect);
      expect(HttpStatusType.MovedPermanently.enum).toEqual(HttpStatusEnum.Redirect);
      expect(HttpStatusType.Found.enum).toEqual(HttpStatusEnum.Redirect);
      expect(HttpStatusType.NotModified.enum).toEqual(HttpStatusEnum.Redirect);
    });
    it("should handle all client error status codes", () => {
      expect(HttpStatusType.BadRequest.enum).toEqual(HttpStatusEnum.ClientError);
      expect(HttpStatusType.Unauthorized.enum).toEqual(HttpStatusEnum.ClientError);
      expect(HttpStatusType.Forbidden.enum).toEqual(HttpStatusEnum.ClientError);
      expect(HttpStatusType.NotFound.enum).toEqual(HttpStatusEnum.ClientError);
    });
    it("should handle all server error status codes", () => {
      expect(HttpStatusType.InternalServerError.enum).toEqual(HttpStatusEnum.ServerError);
      expect(HttpStatusType.NotImplemented.enum).toEqual(HttpStatusEnum.ServerError);
      expect(HttpStatusType.BadGateway.enum).toEqual(HttpStatusEnum.ServerError);
      expect(HttpStatusType.ServiceUnavailable.enum).toEqual(HttpStatusEnum.ServerError);
    });
  });

  describe("HttpStatusType iteration", () => {
    it("should be iterable", () => {
      const statuses = [...HttpStatusType];
      expect(statuses.length).toBeGreaterThan(0);
      expect(statuses[0]).toHaveProperty("name");
      expect(statuses[0]).toHaveProperty("status");
      expect(statuses[0]).toHaveProperty("enum");
    });
    it("should have correct length", () => {
      expect(HttpStatusType.length).toBeGreaterThan(50);
    });
  });

  describe("HttpStatusType constants access", () => {
    it("should access constants by name", () => {
      expect(HttpStatusType.constants["ok"]).toBeDefined();
      expect(HttpStatusType.constants["not-found"]).toBeDefined();
    });
    it("should access constants by label", () => {
      expect(HttpStatusType.constants["OK"]).toBeDefined();
      expect(HttpStatusType.constants["Not Found"]).toBeDefined();
    });
  });

  describe("HttpStatusType matcher", () => {
    it("should have default matcher", () => {
      expect(HttpStatusType.matcher).toBeDefined();
      expect(typeof HttpStatusType.matcher).toBe("function");
    });
    it("should allow custom matcher", () => {
      const originalMatcher = HttpStatusType.matcher;
      HttpStatusType.matcher = (v) => v.toLowerCase();
      expect(HttpStatusType.parse("OK")?.name).toEqual("ok");
      HttpStatusType.matcher = originalMatcher;
    });
  });
});
