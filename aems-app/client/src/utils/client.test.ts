import { filter, ConditionalWrapper, renderTerm, getTerm } from "./client";

describe("ConditionalWrapper", () => {
  it("should render children directly when condition is false", () => {
    const mockChildren = "Test Content";
    const mockWrapper = jest.fn((children) => `<div class="wrapper">${children}</div>`);
    
    const result = ConditionalWrapper({
      condition: false,
      wrapper: mockWrapper,
      children: mockChildren,
    });

    expect(result).toBe(mockChildren);
    expect(mockWrapper).not.toHaveBeenCalled();
  });

  it("should apply wrapper when condition is true", () => {
    const mockChildren = "Test Content";
    const mockWrapper = jest.fn((children) => `<div class="wrapper">${children}</div>`);
    
    const result = ConditionalWrapper({
      condition: true,
      wrapper: mockWrapper,
      children: mockChildren,
    });

    expect(mockWrapper).toHaveBeenCalledWith(mockChildren);
    expect(result).toBe('<div class="wrapper">Test Content</div>');
  });

  it("should handle different wrapper functions", () => {
    const mockChildren = "Paragraph content";
    const mockWrapper = (children: any) => `<section data-testid="section">${children}</section>`;
    
    const result = ConditionalWrapper({
      condition: true,
      wrapper: mockWrapper,
      children: mockChildren,
    });

    expect(result).toBe('<section data-testid="section">Paragraph content</section>');
  });

  it("should work with React elements as children", () => {
    const mockChildren = "Test Element";
    const mockWrapper = (children: any) => ({ type: "strong", props: { children } });
    
    const result = ConditionalWrapper({
      condition: true,
      wrapper: mockWrapper,
      children: mockChildren,
    });

    expect(result).toEqual({ type: "strong", props: { children: mockChildren } });
  });

  it("should pass through children unchanged when condition is false", () => {
    const mockChildren = "Test Element";
    const mockWrapper = jest.fn();
    
    const result = ConditionalWrapper({
      condition: false,
      wrapper: mockWrapper,
      children: mockChildren,
    });

    expect(result).toBe(mockChildren);
    expect(mockWrapper).not.toHaveBeenCalled();
  });
});

describe("renderTerm", () => {
  it("should render plain text when no terms exist", () => {
    const item = { name: "John Doe", age: 30 };
    const result = renderTerm(item, "name");

    // Check that it returns a React element with span and the field value
    expect(result).toEqual(
      expect.objectContaining({
        type: "span",
        props: expect.objectContaining({
          children: "John Doe"
        })
      })
    );
  });

  it("should render highlighted terms with proper markup when terms exist", () => {
    const item = {
      name: "John Doe",
      terms: {
        name: ["Jo", "hn", " Doe"] as [string, string, string],
      },
    } as any;
    const result = renderTerm(item, "name");

    // Check that it returns a React element with proper structure
    expect(result).toEqual(
      expect.objectContaining({
        type: "span",
        props: expect.objectContaining({
          children: expect.arrayContaining([
            "Jo",
            expect.objectContaining({
              type: "mark",
              props: expect.objectContaining({
                children: expect.objectContaining({
                  type: "strong",
                  props: expect.objectContaining({
                    children: "hn"
                  })
                })
              })
            }),
            " Doe"
          ])
        })
      })
    );
  });

  it("should handle empty prefix and suffix", () => {
    const item = {
      title: "Test",
      terms: {
        title: ["", "Test", ""] as [string, string, string],
      },
    } as any;
    const result = renderTerm(item, "title");

    expect(result).toEqual(
      expect.objectContaining({
        type: "span",
        props: expect.objectContaining({
          children: expect.arrayContaining([
            "",
            expect.objectContaining({
              type: "mark"
            }),
            ""
          ])
        })
      })
    );
  });

  it("should handle different field types", () => {
    const item = {
      count: 42,
      terms: {
        count: ["", "42", ""] as [string, string, string],
      },
    } as any;
    const result = renderTerm(item, "count");

    expect(result).toEqual(
      expect.objectContaining({
        type: "span"
      })
    );
  });

  it("should render number fields as strings when no terms", () => {
    const item = { count: 42, name: "test" };
    const result = renderTerm(item, "count");

    expect(result).toEqual(
      expect.objectContaining({
        type: "span",
        props: expect.objectContaining({
          children: "42"
        })
      })
    );
  });
});

describe("getTerm", () => {
  it("should create proper term arrays for case-insensitive matches", () => {
    const item = { name: "John Doe" };
    const result = getTerm(item, "name", "john");

    expect(result).toEqual({
      name: ["", "John", " Doe"],
    });
  });

  it("should handle cases where term is not found", () => {
    const item = { name: "John Doe" };
    const result = getTerm(item, "name", "xyz");

    expect(result).toEqual({
      name: ["John Doe", "", ""],
    });
  });

  it("should handle empty search terms", () => {
    const item = { name: "John Doe" };
    const result = getTerm(item, "name", "");

    expect(result).toEqual({
      name: ["John Doe", "", ""],
    });
  });

  it("should work with different data types", () => {
    const item = { count: 123 };
    const result = getTerm(item, "count", "23");

    expect(result).toEqual({
      count: ["1", "23", ""],
    });
  });

  it("should handle partial matches correctly", () => {
    const item = { email: "user@example.com" };
    const result = getTerm(item, "email", "example");

    expect(result).toEqual({
      email: ["user@", "example", ".com"],
    });
  });

  it("should be case insensitive", () => {
    const item = { title: "JavaScript Developer" };
    const result = getTerm(item, "title", "script");

    expect(result).toEqual({
      title: ["Java", "Script", " Developer"],
    });
  });
});

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

  it("should return empty array when input is empty", () => {
    const items: any[] = [];
    const search = "test";

    const result = filter(items, search, ["key1"]);

    expect(result).toEqual([]);
  });

  it("should be case insensitive", () => {
    const items = [{ name: "John Doe" }, { name: "Jane Smith" }];
    const search = "JOHN";

    const result = filter(items, search, ["name"]);

    expect(result).toEqual([
      {
        name: "John Doe",
        terms: {
          name: ["", "John", " Doe"],
        },
      },
    ]);
  });

  it("should search all fields when no fields specified", () => {
    const items = [
      { name: "John", email: "john@test.com" },
      { name: "Jane", email: "jane@example.com" },
    ];
    const search = "test";

    const result = filter(items, search);

    expect(result).toEqual([
      {
        name: "John",
        email: "john@test.com",
        terms: {
          email: ["john@", "test", ".com"],
        },
      },
    ]);
  });

  it("should handle multiple matching fields", () => {
    const items = [{ title: "Test Project", description: "A test application" }];
    const search = "test";

    const result = filter(items, search, ["title", "description"]);

    expect(result).toEqual([
      {
        title: "Test Project",
        description: "A test application",
        terms: {
          title: ["", "Test", " Project"],
          description: ["A ", "test", " application"],
        },
      },
    ]);
  });

  it("should handle numeric values", () => {
    const items = [{ id: 123, name: "Item" }, { id: 456, name: "Other" }];
    const search = "23";

    const result = filter(items, search, ["id", "name"]);

    expect(result).toEqual([
      {
        id: 123,
        name: "Item",
        terms: {
          id: ["1", "23", ""],
        },
      },
    ]);
  });

  it("should handle partial matches", () => {
    const items = [{ email: "user@example.com" }, { email: "admin@test.org" }];
    const search = "example";

    const result = filter(items, search, ["email"]);

    expect(result).toEqual([
      {
        email: "user@example.com",
        terms: {
          email: ["user@", "example", ".com"],
        },
      },
    ]);
  });

  it("should filter out non-matching items", () => {
    const items = [
      { name: "Apple" },
      { name: "Banana" },
      { name: "Cherry" },
    ];
    const search = "an";

    const result = filter(items, search, ["name"]);

    expect(result).toEqual([
      {
        name: "Banana",
        terms: {
          name: ["B", "an", "ana"],
        },
      },
    ]);
  });

  it("should handle complex objects with nested-like properties", () => {
    const items = [
      { "user.name": "John Doe", "user.email": "john@test.com" },
      { "user.name": "Jane Smith", "user.email": "jane@example.com" },
    ];
    const search = "john";

    const result = filter(items, search, ["user.name", "user.email"]);

    expect(result).toEqual([
      {
        "user.name": "John Doe",
        "user.email": "john@test.com",
        terms: {
          "user.name": ["", "John", " Doe"],
          "user.email": ["", "john", "@test.com"],
        },
      },
    ]);
  });

  it("should handle boolean and null values gracefully", () => {
    const items = [
      { active: true, deleted: null, name: "Test" },
      { active: false, deleted: null, name: "Other" },
    ];
    const search = "true";

    const result = filter(items, search, ["active", "deleted", "name"]);

    expect(result).toEqual([
      {
        active: true,
        deleted: null,
        name: "Test",
        terms: {
          active: ["", "true", ""],
        },
      },
    ]);
  });

  it("should handle undefined and null field values", () => {
    const items = [
      { name: "John", description: undefined },
      { name: "Jane", description: null },
      { name: "Bob", description: "Valid description" },
    ];
    const search = "null";

    const result = filter(items, search, ["name", "description"]);

    expect(result).toEqual([
      {
        name: "Jane",
        description: null,
        terms: {
          description: ["", "null", ""],
        },
      },
    ]);
  });

  it("should handle objects with symbol keys gracefully", () => {
    const symbolKey = Symbol("test");
    const items = [
      { name: "John", [symbolKey]: "hidden" },
      { name: "Jane", regular: "visible" },
    ];
    const search = "john";

    const result = filter(items, search, ["name"]);

    expect(result).toEqual([
      {
        name: "John",
        [symbolKey]: "hidden",
        terms: {
          name: ["", "John", ""],
        },
      },
    ]);
  });
});
