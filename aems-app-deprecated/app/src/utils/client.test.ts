import { filter } from "./client";

describe("filter", () => {
  it("should return the complete array if search is not specified", () => {
    const items = [{ key1: "value1", key2: "value2" }];
    const search = "";

    const result = filter(items, search, ["key1", "key2"]);

    expect(result).toEqual(items);
  });

  it("should return items that match the search term", () => {
    const items = [
      { key1: "value1", key2: "value2" },
      { key1: "value3", key2: "value4" },
    ];
    const search = "value1";

    const result = filter(items, search, ["key1", "key2"]);

    expect(result).toEqual([
      {
        key1: "value1",
        key2: "value2",
        terms: {
          key1: ["", "value1", ""],
        },
      },
    ]);
  });
});
