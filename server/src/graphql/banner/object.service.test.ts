 
 
 

import { BannerObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("BannerObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new BannerObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Banner'", () => {
    const builder = makeBuilder();
    new BannerObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Banner", expect.any(Object));
  });

  it("calls builder.enumType for BannerFields", () => {
    const builder = makeBuilder();
    new BannerObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("BannerFields", expect.any(Object));
  });

  it("assigns BannerObject and BannerFields properties", () => {
    const builder = makeBuilder();
    const instance = new BannerObject(builder);
    expect(instance.BannerObject).toBeDefined();
    expect(instance.BannerFields).toBeDefined();
  });
});
