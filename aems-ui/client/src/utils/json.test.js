import { parse } from "./json";

describe("json.parse(object)", () => {
  it("should parse undefined js", () => {
    const json = undefined;
    const expected = json;
    expect(parse(json)).toEqual(expected);
  });
  it("should parse normal js", () => {
    const json = {
      foo: "bar",
    };
    const expected = json;
    expect(parse(json)).toEqual(expected);
  });
  it("should parse nested js", () => {
    const json = {
      foo: "bar",
      bar: {
        foo: "baz",
      },
    };
    const expected = json;
    expect(parse(json)).toEqual(expected);
  });
  it("should parse simple js ref", () => {
    const json = {
      foo: "bar",
      bar: {
        foo: "baz",
        baz: {
          $ref: "#/foo",
        },
      },
    };
    const expected = {
      foo: "bar",
      bar: {
        foo: "baz",
        baz: "bar",
      },
    };
    expect(parse(json)).toEqual(expected);
  });
  it("should parse nested js ref", () => {
    const json = {
      foo: "bar",
      bar: {
        foo: "baz",
        bar: {
          baz: {
            $ref: "#/foo",
          },
        },
      },
    };
    const expected = {
      foo: "bar",
      bar: {
        foo: "baz",
        bar: { baz: "bar" },
      },
    };
    expect(parse(json)).toEqual(expected);
  });
});
