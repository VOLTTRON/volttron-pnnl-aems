 
 
 

import { FeedbackObject } from "./object.service";
import { SchemaBuilderService } from "../builder.service";

function makeBuilder(): SchemaBuilderService {
  return {
    prismaObject: jest.fn(() => ({})),
    enumType: jest.fn((name: string) => name),
    DateTime: "DateTime",
  } as unknown as SchemaBuilderService;
}

describe("FeedbackObject", () => {
  it("constructs without throwing", () => {
    const builder = makeBuilder();
    expect(() => new FeedbackObject(builder)).not.toThrow();
  });

  it("calls builder.prismaObject with 'Feedback'", () => {
    const builder = makeBuilder();
    new FeedbackObject(builder);
    expect(builder.prismaObject).toHaveBeenCalledWith("Feedback", expect.any(Object));
  });

  it("calls builder.enumType for FeedbackStatus and FeedbackFields", () => {
    const builder = makeBuilder();
    new FeedbackObject(builder);
    expect(builder.enumType).toHaveBeenCalledWith("FeedbackStatus", expect.any(Object));
    expect(builder.enumType).toHaveBeenCalledWith("FeedbackFields", expect.any(Object));
  });

  it("assigns FeedbackStatus, FeedbackObject, and FeedbackFields properties", () => {
    const builder = makeBuilder();
    const instance = new FeedbackObject(builder);
    expect(instance.FeedbackStatus).toBeDefined();
    expect(instance.FeedbackObject).toBeDefined();
    expect(instance.FeedbackFields).toBeDefined();
  });
});
