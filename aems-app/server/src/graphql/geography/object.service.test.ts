 
 
 

import { GeographyObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    addScalarType: jest.fn((name: string) => name),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("GeographyObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new GeographyObject(builder)).not.toThrow();
  });

  it("calls builder.addScalarType for GeographyGeoJson", () => {
    const builder = makeBuilder();
    new GeographyObject(builder);
    expect(builder.addScalarType).toHaveBeenCalledWith("GeographyGeoJson", expect.any(Object));
  });

  it("calls builder.prismaObject with 'Geography'", () => {
    const builder = makeBuilder();
    new GeographyObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Geography", expect.any(Object));
  });

  it("calls builder.enumType for GeographyFields", () => {
    const builder = makeBuilder();
    new GeographyObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("GeographyFields", expect.any(Object));
  });

  it("assigns all three properties", () => {
    const builder = makeBuilder();
    const instance = new GeographyObject(builder);
    expect(instance.GeographyGeoJson).toBeDefined();
    expect(instance.GeographyObject).toBeDefined();
    expect(instance.GeographyFields).toBeDefined();
  });
});
