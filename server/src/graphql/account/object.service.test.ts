 
 
 

import { AccountObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("AccountObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new AccountObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Account'", () => {
    const builder = makeBuilder();
    new AccountObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Account", expect.any(Object));
  });

  it("calls builder.enumType for AccountFields", () => {
    const builder = makeBuilder();
    new AccountObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("AccountFields", expect.any(Object));
  });

  it("assigns AccountObject and AccountFields properties", () => {
    const builder = makeBuilder();
    const instance = new AccountObject(builder);
    expect(instance.AccountObject).toBeDefined();
    expect(instance.AccountFields).toBeDefined();
  });
});
