import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { writeFileSync, unlinkSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { tokenFactory, StreamingJsonReader } from "./json";
import { Feature, Polygon } from "geojson";

process.env.DEBUG_JSON = "false"; // set to true to enable debug mode for testing

describe("JSON Utils", () => {
  let testDir: string;
  let testFiles: string[] = [];

  beforeEach(() => {
    testDir = join(tmpdir(), "json-utils-test-" + Date.now());
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
    testFiles = [];
  });

  afterEach(() => {
    // Clean up test files
    testFiles.forEach((file) => {
      if (existsSync(file)) {
        unlinkSync(file);
      }
    });
  });

  const createTestFile = (filename: string, content: string): string => {
    const filePath = join(testDir, filename);
    writeFileSync(filePath, content, "utf-8");
    testFiles.push(filePath);
    return filePath;
  };

  describe("tokenFactory", () => {
    it("should create root token", () => {
      const token = tokenFactory("$");
      expect(token).toEqual({ type: "root", value: "$" });
    });

    it("should create wildcard token", () => {
      const token = tokenFactory("*");
      expect(token).toEqual({ type: "wildcard", value: "*" });
    });

    it("should create index token", () => {
      const token = tokenFactory("42");
      expect(token).toEqual({ type: "index", value: 42 });
    });

    it("should create range token with both bounds", () => {
      const token = tokenFactory("1:5");
      expect(token).toEqual({ type: "range", value: [1, 5] });
    });

    it("should create range token with start only", () => {
      const token = tokenFactory("3:");
      expect(token).toEqual({ type: "range", value: [3, Infinity] });
    });

    it("should create range token with end only", () => {
      const token = tokenFactory(":10");
      expect(token).toEqual({ type: "range", value: [Infinity, 10] });
    });

    it("should create set token", () => {
      const token = tokenFactory("1,3,5,7");
      expect(token).toEqual({ type: "set", value: [1, 3, 5, 7] });
    });

    it("should create field token for regular strings", () => {
      const token = tokenFactory("name");
      expect(token).toEqual({ type: "field", value: "name" });
    });

    it("should handle edge cases", () => {
      expect(tokenFactory("0")).toEqual({ type: "index", value: 0 });
      expect(tokenFactory("1")).toEqual({ type: "index", value: 1 });
      expect(tokenFactory("field_name")).toEqual({ type: "field", value: "field_name" });
      expect(tokenFactory("field-name")).toEqual({ type: "field", value: "field-name" });
    });
  });

  describe("VirtualJsonFactory - Basic Functionality", () => {
    it("should throw error for non-existent file", async () => {
      await expect(async () => {
        const factory = new StreamingJsonReader("/non/existent/file.json");
        for await (const _node of factory.read("$")) {
          // Should throw
        }
      }).rejects.toThrow();
    });

    it("should throw error for empty file", async () => {
      const filePath = createTestFile("empty.json", "");
      await expect(async () => {
        const factory = new StreamingJsonReader(filePath);
        for await (const _node of factory.read("$")) {
          // Should throw
        }
      }).rejects.toThrow();
    });

    it("should throw error for directory instead of file", async () => {
      await expect(async () => {
        const factory = new StreamingJsonReader(testDir);
        for await (const _node of factory.read("$")) {
          // Should throw
        }
      }).rejects.toThrow();
    });

    it("should create VirtualJsonFactory instance for valid file", async () => {
      const filePath = createTestFile("valid.json", '{"test": "value"}');
      const factory = new StreamingJsonReader(filePath);

      expect(factory).toBeDefined();
      expect(typeof factory.read).toBe("function");

      // Test that we can read from it
      const results: string[] = [];
      for await (const node of factory.read<string>("$.test")) {
        results.push(node);
      }
      expect(results).toHaveLength(1);
      expect(results[0]).toBe("value");
    });
  });

  describe("VirtualJsonFactory - File Watching", () => {
    it("should detect file changes and throw error", async () => {
      const filePath = createTestFile(
        "watched.json",
        JSON.stringify({ initial: Array(1000).fill({ a: 1, b: 2, c: 3, test: "test", d: true, e: false }) }),
      );
      const factory = new StreamingJsonReader(filePath);

      // The next operation should throw an error
      await expect(async () => {
        // Simulate file change
        setTimeout(() => {
          writeFileSync(filePath, '{"changed": "value"}', "utf-8");
        }, 10);
        for await (const _node of factory.read("$.initial[999]")) {
          // This should throw due to file change
        }
      }).rejects.toThrow();
    });
  });

  describe("VirtualJsonFactory - JSON Root", () => {
    it("should read object root", async () => {
      const testData = {
        name: "Test Object",
        description: "A test object for JSON parsing",
        details: {
          created: "2023-01-01",
          updated: "2023-01-02",
        },
        timestamp: 345664545,
        tags: ["test", "json", "parsing"],
        active: true,
      };
      const filePath = createTestFile("root.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const results: string[] = [];
      for await (const node of factory.read<string>("$")) {
        results.push(node);
      }
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(testData);
    });

    // not currently supported
    it.skip("should read array root", async () => {
      const testData = [1, 2, 3, 4, 5];
      const filePath = createTestFile("array-root.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const results: number[] = [];
      for await (const node of factory.read<number>("$[]")) {
        results.push(node);
      }
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(testData);
    });

    it("should read string root", async () => {
      const testData = "Hello, World!";
      const filePath = createTestFile("string-root.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const results: string[] = [];
      for await (const node of factory.read<string>("$")) {
        results.push(node);
      }
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(testData);
    });

    it("should read number root", async () => {
      const testData = 42;
      const filePath = createTestFile("number-root.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const results: number[] = [];
      for await (const node of factory.read<number>("$")) {
        results.push(node);
      }
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(testData);
    });

    it("should read boolean root", async () => {
      const testData = true;
      const filePath = createTestFile("boolean-root.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const results: boolean[] = [];
      for await (const node of factory.read<boolean>("$")) {
        results.push(node);
      }
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(testData);
    });
  });

  describe("VirtualJsonFactory - JSON Parsing", () => {
    it("should parse simple JSON object", async () => {
      const testData = {
        name: "John Doe",
        age: 30,
        active: true,
        score: null,
      };

      const filePath = createTestFile("simple.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const results: string[] = [];
      for await (const node of factory.read<string>("$.name")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe("John Doe");
    });

    it("should parse different data types (string)", async () => {
      const testData = {
        stringValue: "test string",
        numberValue: 42.5,
        booleanTrue: true,
        booleanFalse: false,
        nullValue: null,
      };
      const filePath = createTestFile("types.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      // Test string
      const stringResults: string[] = [];
      for await (const node of factory.read<string>("$.stringValue")) {
        stringResults.push(node);
      }
      expect(stringResults[0]).toBe("test string");
    });

    it("should parse different data types (number)", async () => {
      const testData = {
        stringValue: "test string",
        numberValue: 42.5,
        booleanTrue: true,
        booleanFalse: false,
        nullValue: null,
      };
      const filePath = createTestFile("types.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      // Test number
      const numberResults: number[] = [];
      for await (const node of factory.read<number>("$.numberValue")) {
        numberResults.push(node);
      }
      expect(numberResults[0]).toBe(42.5);
    });

    it("should parse different data types (boolean)", async () => {
      const testData = {
        stringValue: "test string",
        numberValue: 42.5,
        booleanTrue: true,
        booleanFalse: false,
        nullValue: null,
      };
      const filePath = createTestFile("types.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      // Test boolean true
      const boolTrueResults: boolean[] = [];
      for await (const node of factory.read<true>("$.booleanTrue")) {
        boolTrueResults.push(node);
      }
      expect(boolTrueResults[0]).toBe(true);

      // Test boolean false
      const boolFalseResults: boolean[] = [];
      for await (const node of factory.read<false>("$.booleanFalse")) {
        boolFalseResults.push(node);
      }
      expect(boolFalseResults[0]).toBe(false);
    });

    it("should parse different data types (null)", async () => {
      const testData = {
        stringValue: "test string",
        numberValue: 42.5,
        booleanTrue: true,
        booleanFalse: false,
        nullValue: null,
      };
      const filePath = createTestFile("types.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      // Test null
      const nullResults: null[] = [];
      for await (const node of factory.read<null>("$.nullValue")) {
        nullResults.push(node);
      }
      expect(nullResults[0]).toBeNull();
    });

    it("should handle nested string", async () => {
      const testData = {
        user: {
          profile: {
            name: "Jane Smith",
            settings: {
              theme: "dark",
            },
          },
        },
      };
      const filePath = createTestFile("nested.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);
      const nameResults: string[] = [];
      for await (const node of factory.read<string>("$.user.profile.name")) {
        nameResults.push(node);
      }

      expect(nameResults).toHaveLength(1);
      expect(nameResults[0]).toBe("Jane Smith");
    });

    it("should handle nested object", async () => {
      const testData = {
        user: {
          profile: {
            name: "Jane Smith",
            settings: {
              theme: "dark",
            },
          },
        },
      };
      const filePath = createTestFile("nested.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const settingsResults: any[] = [];
      for await (const node of factory.read("$.user.profile.settings")) {
        settingsResults.push(node);
      }

      expect(settingsResults).toHaveLength(1);
      expect(settingsResults[0]).toEqual({ theme: "dark" });
    });

    it("should handle number array index", async () => {
      const testData = {
        numbers: [1, 2, 3, 4, 5],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.numbers[2]")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(3);
    });

    it("should handle field on number array index object", async () => {
      const testData = {
        numbers: [1, 2, 3, 4, 5],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.users[1].age")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(30);
    });

    it("should handle number array set", async () => {
      const testData = {
        numbers: [1, 2, 3, 4, 5],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.numbers[2,3]")) {
        results.push(node);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toBe(3);
      expect(results[1]).toBe(4);
    });

    it("should handle number array range", async () => {
      const testData = {
        numbers: [1, 2, 3, 4, 5],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.numbers[2:4]")) {
        results.push(node);
      }

      expect(results).toHaveLength(2);
      expect(results[0]).toBe(3);
      expect(results[1]).toBe(4);
    });

    it("should handle number array all", async () => {
      const testData = {
        numbers: [1, 2, 3, 4, 5],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.numbers")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual([1, 2, 3, 4, 5]);
    });

    it("should handle number array", async () => {
      const testData = {
        numbers: [1, 2, 3, 4, 5],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.numbers[]")) {
        results.push(node);
      }

      expect(results).toHaveLength(5);
      expect(results).toEqual([1, 2, 3, 4, 5]);
    });

    it("should handle number array array", async () => {
      const testData = {
        numbers: [[1], [2], [3], [4], [5]],
        users: [
          { name: "Alice", age: 25 },
          { name: "Bob", age: 30 },
        ],
      };
      const filePath = createTestFile("arrays.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: number[] = [];
      for await (const node of factory.read<number>("$.numbers[]")) {
        results.push(node);
      }

      expect(results).toHaveLength(5);
      expect(results).toEqual([[1], [2], [3], [4], [5]]);
    });
  });

  describe("VirtualJsonFactory - Edge Cases", () => {
    it("should handle empty JSON object", async () => {
      const filePath = createTestFile("empty-object.json", "{}");
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$.nonexistent")) {
        results.push(node);
      }

      expect(results).toHaveLength(0);
    });

    it("should handle empty JSON array", async () => {
      const filePath = createTestFile("empty-array.json", "[]");
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$[0]")) {
        results.push(node);
      }

      expect(results).toHaveLength(0);
    });

    it("should handle JSON with special characters", async () => {
      const testData = {
        "special-key": "value with spaces",
        unicode: "Hello 世界 🌍",
        escaped: "Line 1\nLine 2\tTabbed",
        quotes: 'String with "quotes"',
      };
      const filePath = createTestFile("special.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$.unicode")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe("Hello 世界 🌍");
    });

    it("should handle very large integer", async () => {
      const testData = {
        largeInt: 9007199254740991,
        largeFloat: 1.7976931348623157e308,
        scientific: 1.23e-10,
        negative: -999999999,
      };

      const filePath = createTestFile("large-numbers.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$.largeInt")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(9007199254740991);
    });

    it("should handle very large float", async () => {
      const testData = {
        largeInt: 9007199254740991,
        largeFloat: 1.7976931348623157e308,
        scientific: 1.23e-10,
        negative: -999999999,
      };

      const filePath = createTestFile("large-numbers.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$.largeFloat")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(1.7976931348623157e308);
    });

    it("should handle scientific number", async () => {
      const testData = {
        largeInt: 9007199254740991,
        largeFloat: 1.7976931348623157e308,
        scientific: 1.23e-10,
        negative: -999999999,
      };

      const filePath = createTestFile("large-numbers.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$.scientific")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(1.23e-10);
    });

    it("should handle negative integer", async () => {
      const testData = {
        largeInt: 9007199254740991,
        largeFloat: 1.7976931348623157e308,
        scientific: 1.23e-10,
        negative: -999999999,
      };

      const filePath = createTestFile("large-numbers.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read("$.negative")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe(-999999999);
    });
  });

  describe("VirtualJsonFactory - Memory Efficiency with Large JSON", () => {
    it("should handle large JSON without loading entire file into memory", async () => {
      // Create a large JSON object
      const largeData: any = {
        metadata: { size: "large", created: new Date().toISOString() },
        items: [],
      };

      // Add 100,000 items to make it reasonably large
      for (let i = 0; i < 100000; i++) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        largeData.items.push({
          id: i,
          name: `Item ${i}`,
          description: `This is item number ${i} with some additional text to make it larger`,
          tags: [`tag${i % 10}`, `category${i % 5}`, `type${i % 3}`],
          metadata: {
            created: new Date(Date.now() - i * 1000).toISOString(),
            updated: new Date().toISOString(),
            version: Math.floor(i / 100) + 1,
          },
        });
      }

      const jsonString = JSON.stringify(largeData);
      const filePath = createTestFile("large.json", jsonString);

      const factory = new StreamingJsonReader(filePath);

      // Access specific item without loading entire array
      const results: any[] = [];
      for await (const node of factory.read("$.items[5000].name")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe("Item 5000");
    }, 300000); // Increase timeout for large file test

    it("should efficiently handle multiple queries on large JSON", async () => {
      // Create structured large data
      const largeData = {
        users: [] as any[],
        products: [] as any[],
        orders: [] as any[],
      };

      // Add data to each section
      for (let i = 0; i < 1000; i++) {
        largeData.users.push({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          profile: { age: 20 + (i % 50), city: `City ${i % 100}` },
        });

        largeData.products.push({
          id: i,
          name: `Product ${i}`,
          price: (i % 1000) + 0.99,
          category: `Category ${i % 20}`,
        });

        largeData.orders.push({
          id: i,
          userId: i % 1000,
          productId: (i + 500) % 1000,
          quantity: (i % 10) + 1,
          total: ((i % 1000) + 0.99) * ((i % 10) + 1),
        });
      }

      const filePath = createTestFile("large-structured.json", JSON.stringify(largeData));
      const factory = new StreamingJsonReader(filePath);

      // Multiple queries should reuse cached sections
      const queries = [
        "$.users[100].name",
        "$.users[100].email",
        "$.products[200].name",
        "$.products[200].price",
        "$.orders[300].total",
      ];

      const startTime = Date.now();

      for (const query of queries) {
        const results: any[] = [];
        for await (const node of factory.read(query)) {
          results.push(node);
        }
        expect(results).toHaveLength(1);
      }

      const totalTime = Date.now() - startTime;

      // All queries should complete reasonably quickly
      expect(totalTime).toBeLessThan(5000); // Less than 5 seconds
    }, 15000);
  });

  describe("VirtualJsonFactory - Error Handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const malformedJson = '{"name": "test", "incomplete": ';
      const filePath = createTestFile("malformed.json", malformedJson);
      const factory = new StreamingJsonReader(filePath);

      // Should not crash, but may not find complete results
      const results: any[] = [];
      for await (const node of factory.read("$.name")) {
        results.push(node);
      }

      // The parser should handle incomplete JSON gracefully
      // Results may be empty or partial, but shouldn't crash
      expect(Array.isArray(results)).toBe(true);
    });

    it("should clean up resources on error", async () => {
      const filePath = createTestFile("cleanup-test.json", '{"test": "value"}');
      const factory = new StreamingJsonReader(filePath);

      let errorOccurred = false;
      try {
        for await (const _node of factory.read("$.test")) {
          // Simulate error by deleting file during operation
          unlinkSync(filePath);
        }
      } catch (error) {
        expect(error).toBeDefined();
        errorOccurred = true;
      }
      expect(errorOccurred).toBe(true);

      // Resources should be cleaned up
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((factory as any).stream).toBeNull();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((factory as any).watcher).toBeNull();
    });
  });

  describe("VirtualJsonFactory - Path Parsing", () => {
    it("should handle various JSONPath formats", async () => {
      const testData = {
        "field-with-dashes": "value1",
        field_with_underscores: "value2",
        fieldWithCamelCase: "value3",
        "123numeric": "value4",
      };
      const filePath = createTestFile("path-formats.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      // Test different field name formats
      const queries = ["$.field-with-dashes", "$.field_with_underscores", "$.fieldWithCamelCase", "$.123numeric"];

      for (let i = 0; i < queries.length; i++) {
        const results: any[] = [];
        for await (const node of factory.read(queries[i])) {
          results.push(node);
        }
        expect(results).toHaveLength(1);
        expect(results[0]).toBe(`value${i + 1}`);
      }
    });

    it("should handle whitespace in paths", async () => {
      const testData = { test: "value" };
      const filePath = createTestFile("whitespace-path.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      // Path with various whitespace should be normalized
      const results: any[] = [];
      for await (const node of factory.read("  $ . test  ")) {
        results.push(node);
      }

      expect(results).toHaveLength(1);
      expect(results[0]).toBe("value");
    });
  });

  describe("VirtualJsonFactory - GeoJSON Features", () => {
    it("should handle a GeoJSON object", async () => {
      const testData = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-122.4194, 37.7749],
            },
            properties: {
              name: "San Francisco",
              population: 883305,
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-122.4194, 37.7749],
                [-118.2437, 34.0522],
              ],
            },
            properties: {
              name: "Route from San Francisco to Los Angeles",
            },
          },
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [-122.5149, 37.7081],
                  [-122.3569, 37.7081],
                  [-122.3569, 37.8324],
                  [-122.5149, 37.8324],
                  [-122.5149, 37.7081],
                ],
              ],
            },
            properties: {
              name: "San Francisco Boundary",
            },
          },
        ],
      };
      const filePath = createTestFile("geojson.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: Feature[] = [];
      for await (const node of factory.read<Feature>("$.features[]")) {
        results.push(node);
      }

      expect(results).toHaveLength(3);
      expect(results[0]?.properties?.name).toBe("San Francisco");
      expect(results[2]?.geometry?.type).toBe("Polygon");
      expect((results[2]?.geometry as Polygon)?.coordinates?.[0]?.[0]?.[0]).toBe(-122.5149);
    });
  });

  describe("VirtualJsonFactory - Complex Object", () => {
    // this may not be supported because of performance reasons
    it.skip("should handle non root query", async () => {
      const testData = {
        user: {
          id: "USR001",
          name: {
            first: "John",
            middle: "A.",
            last: "Doe",
          },
          email: "john.doe@example.com",
          isActive: true,
          roles: ["admin", "editor", "subscriber"],
          preferences: {
            notifications: {
              email: true,
              sms: false,
              push: {
                enabled: true,
                frequency: "daily",
              },
            },
            theme: "dark",
            language: "en-US",
          },
          address: {
            billing: {
              id: "ADD001",
              street: "123 Elm Street",
              city: "Springfield",
              state: "IL",
              zip: "62704",
              country: "USA",
            },
            shipping: {
              id: "ADD002",
              street: "456 Oak Avenue",
              city: "Shelbyville",
              state: "IL",
              zip: "62565",
              country: "USA",
            },
          },
        },
        orders: [
          {
            id: "ORD001",
            date: "2025-07-15",
            status: "shipped",
            items: [
              {
                id: "PRD001",
                name: "Wireless Mouse",
                quantity: 2,
                price: 25.99,
              },
              {
                id: "PRD002",
                name: "Keyboard",
                quantity: 1,
                price: 49.99,
              },
            ],
            total: 101.97,
          },
          {
            id: "ORD002",
            date: "2025-07-18",
            status: "processing",
            items: [
              {
                id: "PRD003",
                name: "Monitor",
                quantity: 1,
                price: 199.99,
              },
            ],
            total: 199.99,
          },
        ],
        supportTickets: [
          {
            id: "TCK001",
            subject: "Issue with order ORD001",
            status: "resolved",
            createdDate: "2025-07-16",
            updatedDate: "2025-07-17",
            messages: [
              {
                from: "user",
                message: "I received the wrong item.",
                timestamp: "2025-07-16T10:00:00Z",
              },
              {
                from: "support",
                message: "We apologize for the inconvenience. A replacement has been shipped.",
                timestamp: "2025-07-16T12:00:00Z",
              },
            ],
          },
          {
            id: "TCK002",
            subject: "Refund request for order ORD002",
            status: "open",
            createdDate: "2025-07-19",
            updatedDate: null,
            messages: [],
          },
        ],
      };
      const filePath = createTestFile("complex-object.json", JSON.stringify(testData));
      const factory = new StreamingJsonReader(filePath);

      const results: any[] = [];
      for await (const node of factory.read(".id")) {
        results.push(node);
      }

      expect(results).toEqual([
        "USR001",
        "ADD001",
        "ADD002",
        "ORD001",
        "PRD001",
        "PRD002",
        "ORD002",
        "PRD003",
        "TCK001",
        "TCK002",
      ]);
    });
  });
});
