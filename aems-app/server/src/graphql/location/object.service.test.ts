import { LocationObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("LocationObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new LocationObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Location'", () => {
    const builder = makeBuilder();
    new LocationObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Location", expect.any(Object));
  });

  it("calls builder.enumType for LocationFields", () => {
    const builder = makeBuilder();
    new LocationObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("LocationFields", expect.any(Object));
  });

  it("assigns LocationObject and LocationFields properties", () => {
    const builder = makeBuilder();
    const instance = new LocationObject(builder);
    expect(instance.LocationObject).toBeDefined();
    expect(instance.LocationFields).toBeDefined();
  });
});
