 
 
 

import { UserObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    addScalarType: jest.fn((name: string) => name),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("UserObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new UserObject(builder)).not.toThrow();
  });

  it("calls builder.addScalarType for UserPreferences", () => {
    const builder = makeBuilder();
    new UserObject(builder);
    expect(builder.addScalarType).toHaveBeenCalledWith("UserPreferences", expect.any(Object));
  });

  it("calls builder.prismaObject with 'User'", () => {
    const builder = makeBuilder();
    new UserObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("User", expect.any(Object));
  });

  it("calls builder.enumType for UserFields", () => {
    const builder = makeBuilder();
    new UserObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("UserFields", expect.any(Object));
  });

  it("assigns UserPreferences, UserObject, and UserFields properties", () => {
    const builder = makeBuilder();
    const instance = new UserObject(builder);
    expect(instance.UserPreferences).toBeDefined();
    expect(instance.UserObject).toBeDefined();
    expect(instance.UserFields).toBeDefined();
  });

  // scenario: password-hashed-hidden
  describe("password is not exposed", () => {
    it("UserObject declares no 'password' field", () => {
      const builder = makeBuilder();
      new UserObject(builder);
      const [, opts] = (builder.prismaObject as jest.Mock).mock.calls[0] as [string, { fields: (t: unknown) => Record<string, unknown> }];
      const t = {
        exposeString: jest.fn((name: string) => name),
        expose: jest.fn((name: string) => name),
        relation: jest.fn((name: string) => name),
      };
      const fields = opts.fields(t);
      expect(Object.keys(fields)).not.toContain("password");
    });

    it("UserFields enum omits password", () => {
      const builder = makeBuilder();
      new UserObject(builder);
      const [, opts] = (builder.enumType as jest.Mock).mock.calls[0] as [string, { values: string[] }];
      expect(opts.values).not.toContain("password");
    });
  });
});
