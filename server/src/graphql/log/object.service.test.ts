 
 
 

import { LogObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn((name: string) => name),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("LogObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new LogObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Log'", () => {
    const builder = makeBuilder();
    new LogObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Log", expect.any(Object));
  });

  it("calls builder.enumType for LogType and LogFields", () => {
    const builder = makeBuilder();
    new LogObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("LogType", expect.any(Object));
    expect(builder.enumType).toHaveBeenCalledWith("LogFields", expect.any(Object));
  });

  it("assigns LogType, LogObject, and LogFields properties", () => {
    const builder = makeBuilder();
    const instance = new LogObject(builder);
    expect(instance.LogType).toBeDefined();
    expect(instance.LogObject).toBeDefined();
    expect(instance.LogFields).toBeDefined();
  });
});
