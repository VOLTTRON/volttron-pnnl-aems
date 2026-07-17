import { HolidayObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("HolidayObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new HolidayObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Holiday'", () => {
    const builder = makeBuilder();
    new HolidayObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Holiday", expect.any(Object));
  });

  it("calls builder.enumType for HolidayType and HolidayFields", () => {
    const builder = makeBuilder();
    new HolidayObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("HolidayType", expect.any(Object));
    expect(builder.enumType).toHaveBeenCalledWith("HolidayFields", expect.any(Object));
  });

  it("assigns HolidayObject, HolidayFields, and HolidayType properties", () => {
    const builder = makeBuilder();
    const instance = new HolidayObject(builder);
    expect(instance.HolidayObject).toBeDefined();
    expect(instance.HolidayFields).toBeDefined();
    expect(instance.HolidayType).toBeDefined();
  });
});
