 
 
 

import { CommentObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn(() => ({})),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("CommentObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new CommentObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Comment'", () => {
    const builder = makeBuilder();
    new CommentObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Comment", expect.any(Object));
  });

  it("calls builder.enumType for CommentFields", () => {
    const builder = makeBuilder();
    new CommentObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("CommentFields", expect.any(Object));
  });

  it("assigns CommentObject and CommentFields properties", () => {
    const builder = makeBuilder();
    const instance = new CommentObject(builder);
    expect(instance.CommentObject).toBeDefined();
    expect(instance.CommentFields).toBeDefined();
  });
});
