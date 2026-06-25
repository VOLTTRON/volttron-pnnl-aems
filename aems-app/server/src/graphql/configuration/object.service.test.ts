import { ConfigurationObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("ConfigurationObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new ConfigurationObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Configuration'", () => {
    const builder = makeBuilder();
    new ConfigurationObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Configuration", expect.any(Object));
  });

  it("calls builder.enumType for ConfigurationFields", () => {
    const builder = makeBuilder();
    new ConfigurationObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("ConfigurationFields", expect.any(Object));
  });

  it("assigns ConfigurationObject and ConfigurationFields properties", () => {
    const builder = makeBuilder();
    const instance = new ConfigurationObject(builder);
    expect(instance.ConfigurationObject).toBeDefined();
    expect(instance.ConfigurationFields).toBeDefined();
  });
});
