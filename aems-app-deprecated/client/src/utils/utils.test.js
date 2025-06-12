import { filter, getDocumentHeight, getDocumentWidth } from "./utils";

describe("utils.getDocumentWidth()", () => {
  it("width should be 0 when no page is shown", () => {
    expect(getDocumentWidth()).toEqual(0);
  });
});

describe("utils.getDocumentHeight()", () => {
  it("height should be 0 when no page is shown", () => {
    expect(getDocumentHeight()).toEqual(0);
  });
});

describe("utils.filter()", () => {
  let items = null;
  let paths = null;

  beforeEach(() => {
    items = JSON.parse(
      JSON.stringify([
        {
          index: 0,
          name: "zero",
          label: "label",
        },
        {
          index: 1,
          name: "one",
          label: "label",
        },
        {
          index: 2,
          name: "two",
          label: "label",
        },
      ])
    );
    paths = JSON.parse(
      JSON.stringify([
        {
          index: 0,
          name: "zero",
          label: "label",
          items: [
            {
              index: 0,
              name: "zero-a",
              label: "label",
            },
            {
              index: 1,
              name: "zero-b",
              label: "label",
            },
            {
              index: 2,
              name: "zero-c",
              label: "label",
            },
          ],
          data: {
            name: "zero-c",
            label: "label",
          },
        },
        {
          index: 1,
          name: "one",
          label: "label",
          items: [],
          data: {},
        },
        {
          index: 2,
          name: "two",
          label: "label",
          items: null,
          data: null,
        },
      ])
    );
  });

  it("should return all items when no search is specified", () => {
    const expected = items.map((item) => ({
      ...item,
      terms: {
        index: [item.index, "", ""],
        name: [item.name, "", ""],
        label: [item.label, "", ""],
      },
    }));
    expect(filter(items)).toEqual(expected);
  });

  it("should filter terms when keys is specified", () => {
    const expected = items.map((item) => ({
      ...item,
      terms: {
        name: [item.name, "", ""],
        label: [item.label, "", ""],
      },
    }));
    expect(filter(items, null, ["name", "label"])).toEqual(expected);
  });

  it("should filter when search is specified", () => {
    const expected = [
      {
        index: 0,
        name: "zero",
        label: "label",
        terms: {
          index: [0, "", ""],
          name: ["", "z", "ero"],
          label: ["label", "", ""],
        },
      },
    ];
    expect(filter(items, "z")).toEqual(expected);
  });

  it("should filter when search and keys is specified", () => {
    const expected = [
      {
        index: 0,
        name: "zero",
        label: "label",
        terms: {
          name: ["z", "e", "ro"],
        },
      },
      {
        index: 1,
        name: "one",
        label: "label",
        terms: {
          name: ["on", "e", ""],
        },
      },
    ];
    expect(filter(items, "e", ["name"])).toEqual(expected);
  });

  it("should filter when search and path is specified", () => {
    const expected = [
      {
        index: 0,
        name: "zero",
        label: "label",
        terms: {
          name: ["z", "e", "ro"],
        },
      },
      {
        index: 1,
        name: "one",
        label: "label",
        terms: {
          name: ["on", "e", ""],
        },
      },
    ];
    expect(filter(items, "e", ["$.name"])).toEqual(expected);
  });

  it("should filter recursively when search and path is specified", () => {
    const expected = [
      {
        index: 0,
        name: "zero",
        label: "label",
        items: [
          {
            index: 0,
            name: "zero-a",
            label: "label",
          },
          {
            index: 1,
            name: "zero-b",
            label: "label",
          },
          {
            index: 2,
            name: "zero-c",
            label: "label",
            terms: {
              name: ["zero", "-c", ""],
            },
          },
        ],
        data: {
          name: "zero-c",
          label: "label",
          terms: {
            name: ["zero", "-c", ""],
          },
        },
      },
    ];
    expect(filter(paths, "-c", ["$..name"])).toEqual(expected);
  });
});
