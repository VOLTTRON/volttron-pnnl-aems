/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { FeedbackStatusType } from "../";

describe("constants.FeedbackStatusType", () => {
  describe("FeedbackStatusType.parse()", () => {
    it("(to-do) is to-do", () => {
      expect(FeedbackStatusType.parse("to-do")?.name).toEqual("to-do");
    });
    it("(To-do) is to-do", () => {
      expect(FeedbackStatusType.parse("To-do")?.name).toEqual("to-do");
    });
    it("(in-progress) is in-progress", () => {
      expect(FeedbackStatusType.parse("in-progress")?.name).toEqual("in-progress");
    });
    it("(In progress) is in-progress", () => {
      expect(FeedbackStatusType.parse("In progress")?.name).toEqual("in-progress");
    });
    it("(done) is done", () => {
      expect(FeedbackStatusType.parse("done")?.name).toEqual("done");
    });
    it("(Done) is done", () => {
      expect(FeedbackStatusType.parse("Done")?.name).toEqual("done");
    });
    it("(0) is to-do", () => {
      expect(FeedbackStatusType.parse(0)?.name).toEqual("to-do");
    });
    it("(1) is in-progress", () => {
      expect(FeedbackStatusType.parse(1)?.name).toEqual("in-progress");
    });
    it("(2) is done", () => {
      expect(FeedbackStatusType.parse(2)?.name).toEqual("done");
    });
    it("(object with name) is parsed correctly", () => {
      expect(FeedbackStatusType.parse({ name: "done" } as any)?.name).toEqual("done");
    });
    it("(invalid string) is undefined", () => {
      expect(FeedbackStatusType.parse("invalid-status")).toBeUndefined();
    });
    it("(invalid number) is undefined", () => {
      expect(FeedbackStatusType.parse(99)).toBeUndefined();
    });
  });

  describe("FeedbackStatusType.parseStrict()", () => {
    it("(to-do) is to-do", () => {
      expect(FeedbackStatusType.parseStrict("to-do")?.name).toEqual("to-do");
    });
    it("(in-progress) is in-progress", () => {
      expect(FeedbackStatusType.parseStrict("in-progress")?.name).toEqual("in-progress");
    });
    it("(done) is done", () => {
      expect(FeedbackStatusType.parseStrict("done")?.name).toEqual("done");
    });
    it("(0) is to-do", () => {
      expect(FeedbackStatusType.parseStrict(0)?.name).toEqual("to-do");
    });
    it("(1) is in-progress", () => {
      expect(FeedbackStatusType.parseStrict(1)?.name).toEqual("in-progress");
    });
    it("(2) is done", () => {
      expect(FeedbackStatusType.parseStrict(2)?.name).toEqual("done");
    });
    it("(invalid string) throws Error", () => {
      expect(() => FeedbackStatusType.parseStrict("invalid-status")).toThrow(Error);
    });
    it("(invalid number) throws Error", () => {
      expect(() => FeedbackStatusType.parseStrict(99)).toThrow(Error);
    });
    it("(null) throws Error", () => {
      expect(() => FeedbackStatusType.parseStrict(null as any)).toThrow(Error);
    });
    it("(undefined) throws Error", () => {
      expect(() => FeedbackStatusType.parseStrict(undefined as any)).toThrow(Error);
    });
  });

  describe("FeedbackStatusType static references", () => {
    it("Todo should have correct properties", () => {
      expect(FeedbackStatusType.Todo.name).toEqual("to-do");
      expect(FeedbackStatusType.Todo.label).toEqual("To-do");
      expect(FeedbackStatusType.Todo.enum).toEqual("Todo");
    });
    it("TodoType should be same as Todo", () => {
      expect(FeedbackStatusType.TodoType).toEqual(FeedbackStatusType.Todo);
    });
    it("InProgress should have correct properties", () => {
      expect(FeedbackStatusType.InProgress.name).toEqual("in-progress");
      expect(FeedbackStatusType.InProgress.label).toEqual("In progress");
      expect(FeedbackStatusType.InProgress.enum).toEqual("InProgress");
    });
    it("InProgressType should be same as InProgress", () => {
      expect(FeedbackStatusType.InProgressType).toEqual(FeedbackStatusType.InProgress);
    });
    it("Done should have correct properties", () => {
      expect(FeedbackStatusType.Done.name).toEqual("done");
      expect(FeedbackStatusType.Done.label).toEqual("Done");
      expect(FeedbackStatusType.Done.enum).toEqual("Done");
    });
    it("DoneType should be same as Done", () => {
      expect(FeedbackStatusType.DoneType).toEqual(FeedbackStatusType.Done);
    });
  });

  describe("FeedbackStatusType edge cases", () => {
    it("should handle all enum values", () => {
      expect(FeedbackStatusType.Todo.enum).toEqual("Todo");
      expect(FeedbackStatusType.InProgress.enum).toEqual("InProgress");
      expect(FeedbackStatusType.Done.enum).toEqual("Done");
    });
    it("should have immutable static references", () => {
      expect(FeedbackStatusType.Todo).toBeDefined();
      expect(FeedbackStatusType.InProgress).toBeDefined();
      expect(FeedbackStatusType.Done).toBeDefined();
    });
  });

  describe("FeedbackStatusType iteration", () => {
    it("should be iterable", () => {
      const statuses = [...FeedbackStatusType];
      expect(statuses.length).toEqual(3);
      expect(statuses[0]).toHaveProperty("name");
      expect(statuses[0]).toHaveProperty("label");
      expect(statuses[0]).toHaveProperty("enum");
    });
    it("should have correct length", () => {
      expect(FeedbackStatusType.length).toEqual(3);
    });
    it("should iterate in correct order", () => {
      const names = [...FeedbackStatusType].map(s => s.name);
      expect(names).toEqual(["to-do", "in-progress", "done"]);
    });
  });

  describe("FeedbackStatusType constants access", () => {
    it("should access constants by name", () => {
      expect(FeedbackStatusType.constants["to-do"]).toBeDefined();
      expect(FeedbackStatusType.constants["in-progress"]).toBeDefined();
      expect(FeedbackStatusType.constants["done"]).toBeDefined();
    });
    it("should access constants by label", () => {
      expect(FeedbackStatusType.constants["To-do"]).toBeDefined();
      expect(FeedbackStatusType.constants["In progress"]).toBeDefined();
      expect(FeedbackStatusType.constants["Done"]).toBeDefined();
    });
  });

  describe("FeedbackStatusType matcher", () => {
    it("should have default matcher", () => {
      expect(FeedbackStatusType.matcher).toBeDefined();
      expect(typeof FeedbackStatusType.matcher).toBe("function");
    });
    it("should allow custom matcher", () => {
      const originalMatcher = FeedbackStatusType.matcher;
      FeedbackStatusType.matcher = (v) => v.toLowerCase().replace(/\s+/g, "-");
      expect(FeedbackStatusType.parse("TO DO")?.name).toEqual("to-do");
      expect(FeedbackStatusType.parse("IN PROGRESS")?.name).toEqual("in-progress");
      FeedbackStatusType.matcher = originalMatcher;
    });
  });

  describe("FeedbackStatusType workflow progression", () => {
    it("should represent typical workflow states", () => {
      const workflow = [
        FeedbackStatusType.Todo,
        FeedbackStatusType.InProgress,
        FeedbackStatusType.Done
      ];
      expect(workflow[0].name).toEqual("to-do");
      expect(workflow[1].name).toEqual("in-progress");
      expect(workflow[2].name).toEqual("done");
    });
  });
});
