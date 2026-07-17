import { ScheduleObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("ScheduleObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new ScheduleObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Schedule'", () => {
    const builder = makeBuilder();
    new ScheduleObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Schedule", expect.any(Object));
  });

  it("calls builder.enumType for ScheduleFields", () => {
    const builder = makeBuilder();
    new ScheduleObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("ScheduleFields", expect.any(Object));
  });

  it("assigns ScheduleObject and ScheduleFields properties", () => {
    const builder = makeBuilder();
    const instance = new ScheduleObject(builder);
    expect(instance.ScheduleObject).toBeDefined();
    expect(instance.ScheduleFields).toBeDefined();
  });
});
