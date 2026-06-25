import { ControlObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("ControlObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new ControlObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Control'", () => {
    const builder = makeBuilder();
    new ControlObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Control", expect.any(Object));
  });

  it("calls builder.enumType for ControlFields", () => {
    const builder = makeBuilder();
    new ControlObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("ControlFields", expect.any(Object));
  });

  it("assigns ControlObject and ControlFields properties", () => {
    const builder = makeBuilder();
    const instance = new ControlObject(builder);
    expect(instance.ControlObject).toBeDefined();
    expect(instance.ControlFields).toBeDefined();
  });
});
