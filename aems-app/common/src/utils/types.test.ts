import { DeepPartial, DeepNullable, DeepTyped, WithRequired } from "./types";

// Test interfaces for type testing
interface TestInterface {
  name: string;
  age: number;
  address: {
    street: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  hobbies: string[];
}

interface SimpleInterface {
  id: number;
  name?: string;
  email?: string;
}

describe("utils.types", () => {
  describe("DeepPartial<T>", () => {
    it("should make all properties optional", () => {
      const partialTest: DeepPartial<TestInterface> = {};
      expect(partialTest).toBeDefined();
    });

    it("should make nested properties optional", () => {
      const partialTest: DeepPartial<TestInterface> = {
        name: "John",
        address: {
          street: "123 Main St"
          // city and coordinates are optional
        }
      };
      expect(partialTest.name).toEqual("John");
      expect(partialTest.address?.street).toEqual("123 Main St");
    });

    it("should make deeply nested properties optional", () => {
      const partialTest: DeepPartial<TestInterface> = {
        address: {
          coordinates: {
            lat: 40.7128
            // lng is optional
          }
        }
      };
      expect(partialTest.address?.coordinates?.lat).toEqual(40.7128);
    });

    it("should work with arrays", () => {
      const partialTest: DeepPartial<TestInterface> = {
        hobbies: ["reading"]
      };
      expect(partialTest.hobbies).toEqual(["reading"]);
    });

    it("should work with primitive types", () => {
      const partialString: DeepPartial<string> = "test";
      const partialNumber: DeepPartial<number> = 42;
      const partialBoolean: DeepPartial<boolean> = true;
      
      expect(partialString).toEqual("test");
      expect(partialNumber).toEqual(42);
      expect(partialBoolean).toEqual(true);
    });
  });

  describe("DeepNullable<T>", () => {
    it("should allow null for all properties", () => {
      const nullableTest: DeepNullable<TestInterface> = {
        name: null,
        age: null,
        address: null,
        hobbies: null
      };
      expect(nullableTest.name).toBeNull();
      expect(nullableTest.age).toBeNull();
      expect(nullableTest.address).toBeNull();
      expect(nullableTest.hobbies).toBeNull();
    });

    it("should allow null for nested properties", () => {
      const nullableTest: DeepNullable<TestInterface> = {
        name: "John",
        age: 30,
        address: {
          street: null,
          city: "New York",
          coordinates: null
        },
        hobbies: ["reading"]
      };
      expect(nullableTest.name).toEqual("John");
      if (nullableTest.address && typeof nullableTest.address === "object") {
        expect(nullableTest.address.street).toBeNull();
        expect(nullableTest.address.city).toEqual("New York");
        expect(nullableTest.address.coordinates).toBeNull();
      }
    });

    it("should allow null for deeply nested properties", () => {
      const nullableTest: DeepNullable<TestInterface> = {
        name: "John",
        age: 30,
        address: {
          street: "123 Main St",
          city: "New York",
          coordinates: {
            lat: null,
            lng: -74.0060
          }
        },
        hobbies: ["reading"]
      };
      if (nullableTest.address && typeof nullableTest.address === "object" && 
          nullableTest.address.coordinates && typeof nullableTest.address.coordinates === "object") {
        expect(nullableTest.address.coordinates.lat).toBeNull();
        expect(nullableTest.address.coordinates.lng).toEqual(-74.0060);
      }
    });

    it("should work with primitive types", () => {
      const nullableString: DeepNullable<string> = null;
      const nullableNumber: DeepNullable<number> = null;
      const nullableBoolean: DeepNullable<boolean> = null;
      
      expect(nullableString).toBeNull();
      expect(nullableNumber).toBeNull();
      expect(nullableBoolean).toBeNull();
    });
  });

  describe("DeepTyped<T, X>", () => {
    it("should allow additional type for all properties", () => {
      const typedTest: DeepTyped<TestInterface, string> = {
        name: "John",
        age: "thirty", // can be string instead of number
        address: "123 Main St", // can be string instead of object
        hobbies: "reading" // can be string instead of array
      };
      expect(typedTest.name).toEqual("John");
      expect(typedTest.age).toEqual("thirty");
      expect(typedTest.address).toEqual("123 Main St");
      expect(typedTest.hobbies).toEqual("reading");
    });

    it("should allow additional type for nested properties", () => {
      const typedTest: DeepTyped<TestInterface, boolean> = {
        name: "John",
        age: 30,
        address: {
          street: true, // can be boolean instead of string
          city: "New York",
          coordinates: false // can be boolean instead of object
        },
        hobbies: ["reading"]
      };
      if (typeof typedTest.address === "object" && typedTest.address !== null) {
        expect(typedTest.address.street).toEqual(true);
        expect(typedTest.address.coordinates).toEqual(false);
      }
    });

    it("should allow additional type for deeply nested properties", () => {
      const typedTest: DeepTyped<TestInterface, null> = {
        name: "John",
        age: 30,
        address: {
          street: "123 Main St",
          city: "New York",
          coordinates: {
            lat: null, // can be null instead of number
            lng: -74.0060
          }
        },
        hobbies: ["reading"]
      };
      if (typeof typedTest.address === "object" && typedTest.address !== null &&
          typeof typedTest.address.coordinates === "object" && typedTest.address.coordinates !== null) {
        expect(typedTest.address.coordinates.lat).toBeNull();
        expect(typedTest.address.coordinates.lng).toEqual(-74.0060);
      }
    });

    it("should work with primitive types", () => {
      const typedString: DeepTyped<string, number> = 42;
      const typedNumber: DeepTyped<number, string> = "test";
      const typedBoolean: DeepTyped<boolean, null> = null;
      
      expect(typedString).toEqual(42);
      expect(typedNumber).toEqual("test");
      expect(typedBoolean).toBeNull();
    });
  });

  describe("WithRequired<T, K>", () => {
    it("should make specified optional properties required", () => {
      const requiredTest: WithRequired<SimpleInterface, "name"> = {
        id: 1,
        name: "John" // now required
        // email is still optional
      };
      expect(requiredTest.id).toEqual(1);
      expect(requiredTest.name).toEqual("John");
    });

    it("should make multiple specified properties required", () => {
      const requiredTest: WithRequired<SimpleInterface, "name" | "email"> = {
        id: 1,
        name: "John", // now required
        email: "john@example.com" // now required
      };
      expect(requiredTest.id).toEqual(1);
      expect(requiredTest.name).toEqual("John");
      expect(requiredTest.email).toEqual("john@example.com");
    });

    it("should preserve existing required properties", () => {
      const requiredTest: WithRequired<SimpleInterface, "name"> = {
        id: 1, // was already required
        name: "John" // now required
      };
      expect(requiredTest.id).toEqual(1);
      expect(requiredTest.name).toEqual("John");
    });

    it("should work with complex interfaces", () => {
      interface ComplexInterface {
        required: string;
        optional1?: number;
        optional2?: boolean;
        optional3?: {
          nested?: string;
        };
      }

      const complexTest: WithRequired<ComplexInterface, "optional1" | "optional2"> = {
        required: "test",
        optional1: 42, // now required
        optional2: true // now required
        // optional3 is still optional
      };
      expect(complexTest.required).toEqual("test");
      expect(complexTest.optional1).toEqual(42);
      expect(complexTest.optional2).toEqual(true);
    });
  });

  describe("Type utility edge cases", () => {
    it("should handle empty objects", () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      const emptyPartial: DeepPartial<{}> = {};
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      const emptyNullable: DeepNullable<{}> = {};
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      const emptyTyped: DeepTyped<{}, string> = {};
      // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      const emptyRequired: WithRequired<{}, never> = {};
      
      expect(emptyPartial).toEqual({});
      expect(emptyNullable).toEqual({});
      expect(emptyTyped).toEqual({});
      expect(emptyRequired).toEqual({});
    });

    it("should handle union types", () => {
      type UnionType = string | number;
      const partialUnion: DeepPartial<UnionType> = "test";
      const nullableUnion: DeepNullable<UnionType> = null;
      const typedUnion: DeepTyped<UnionType, boolean> = true;
      
      expect(partialUnion).toEqual("test");
      expect(nullableUnion).toBeNull();
      expect(typedUnion).toEqual(true);
    });

    it("should handle array types correctly", () => {
      type ArrayType = string[];
      const partialArray: DeepPartial<ArrayType> = ["test"];
      const typedArrayAsArray: DeepTyped<ArrayType, number> = ["test"];
      
      expect(partialArray).toEqual(["test"]);
      expect(typedArrayAsArray).toEqual(["test"]);
    });
  });
});
