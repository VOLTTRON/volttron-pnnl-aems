import { ChangeObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    addScalarType: jest.fn((name: string) => name),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("ChangeObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new ChangeObject(builder)).not.toThrow();
  });

  it("calls builder.addScalarType for ChangeData", () => {
    const builder = makeBuilder();
    new ChangeObject(builder);
    expect(builder.addScalarType).toHaveBeenCalledWith("ChangeData", expect.any(Object));
  });

  it("calls builder.enumType for ChangeMutation and ChangeFields", () => {
    const builder = makeBuilder();
    new ChangeObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("ChangeMutation", expect.any(Object));
    expect(builder.enumType).toHaveBeenCalledWith("ChangeFields", expect.any(Object));
  });

  it("calls builder.prismaObject with 'Change'", () => {
    const builder = makeBuilder();
    new ChangeObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Change", expect.any(Object));
  });

  it("assigns ChangeData, ChangeObject, ChangeFields, and ChangeMutation properties", () => {
    const builder = makeBuilder();
    const instance = new ChangeObject(builder);
    expect(instance.ChangeData).toBeDefined();
    expect(instance.ChangeObject).toBeDefined();
    expect(instance.ChangeFields).toBeDefined();
    expect(instance.ChangeMutation).toBeDefined();
  });
});
