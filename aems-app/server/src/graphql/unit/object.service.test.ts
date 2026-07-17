import { UnitObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("UnitObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new UnitObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Unit'", () => {
    const builder = makeBuilder();
    new UnitObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Unit", expect.any(Object));
  });

  it("calls builder.enumType for UnitFields", () => {
    const builder = makeBuilder();
    new UnitObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("UnitFields", expect.any(Object));
  });

  it("assigns UnitObject and UnitFields properties", () => {
    const builder = makeBuilder();
    const instance = new UnitObject(builder);
    expect(instance.UnitObject).toBeDefined();
    expect(instance.UnitFields).toBeDefined();
  });
});
