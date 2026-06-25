import { OccupancyObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
    ModelStage: "ModelStage",
  } as unknown as SchemaBuilderService;
}

describe("OccupancyObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new OccupancyObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Occupancy'", () => {
    const builder = makeBuilder();
    new OccupancyObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Occupancy", expect.any(Object));
  });

  it("calls builder.enumType for OccupancyFields", () => {
    const builder = makeBuilder();
    new OccupancyObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("OccupancyFields", expect.any(Object));
  });

  it("assigns OccupancyObject and OccupancyFields properties", () => {
    const builder = makeBuilder();
    const instance = new OccupancyObject(builder);
    expect(instance.OccupancyObject).toBeDefined();
    expect(instance.OccupancyFields).toBeDefined();
  });
});
