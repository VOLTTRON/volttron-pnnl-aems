 
 
 

import { FileObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("FileObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new FileObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'File'", () => {
    const builder = makeBuilder();
    new FileObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("File", expect.any(Object));
  });

  it("calls builder.enumType for FileFields", () => {
    const builder = makeBuilder();
    new FileObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("FileFields", expect.any(Object));
  });

  it("assigns FileObject and FileFields properties", () => {
    const builder = makeBuilder();
    const instance = new FileObject(builder);
    expect(instance.FileObject).toBeDefined();
    expect(instance.FileFields).toBeDefined();
  });
});
