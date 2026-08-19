import { KeycloakObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  const mockRef = { implement: jest.fn(() => ({})) };
  return {
    objectRef: jest.fn(() => mockRef),
  } as unknown as SchemaBuilderService;
}

describe("KeycloakObject", () => {
  it("constructs without throwing", () => {
    expect(() => new KeycloakObject(makeBuilder())).not.toThrow();
  });

  it("calls builder.objectRef with 'KeycloakRole'", () => {
    const builder = makeBuilder();
    new KeycloakObject(builder);
    expect(builder.objectRef).toHaveBeenCalledWith("KeycloakRole");
  });

  it("calls .implement() on the returned ref", () => {
    const mockRef = { implement: jest.fn(() => ({})) };
    const builder = { objectRef: jest.fn(() => mockRef) } as unknown as SchemaBuilderService;
    new KeycloakObject(builder);
    expect(mockRef.implement).toHaveBeenCalledWith(expect.objectContaining({ fields: expect.any(Function) }));
  });

  it("assigns a truthy KeycloakRole property", () => {
    const instance = new KeycloakObject(makeBuilder());
    expect(instance.KeycloakRole).toBeDefined();
  });
});
