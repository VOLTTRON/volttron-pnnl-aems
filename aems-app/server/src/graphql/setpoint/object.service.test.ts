import { SetpointObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("SetpointObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new SetpointObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Setpoint'", () => {
    const builder = makeBuilder();
    new SetpointObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Setpoint", expect.any(Object));
  });

  it("calls builder.enumType for SetpointFields", () => {
    const builder = makeBuilder();
    new SetpointObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("SetpointFields", expect.any(Object));
  });

  it("assigns SetpointObject and SetpointFields properties", () => {
    const builder = makeBuilder();
    const instance = new SetpointObject(builder);
    expect(instance.SetpointObject).toBeDefined();
    expect(instance.SetpointFields).toBeDefined();
  });
});
