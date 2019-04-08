import retrieveInternalValue from "../../utils/retrieveInternalValue";

describe("tests the ability to search for a deeply nested object", () => {
  test("returns undefined if not found", () => {
    const obj = {
      some: "key"
    };

    const result = retrieveInternalValue(obj, "otherstring");

    expect(result).toBeUndefined();
  });

  test("can get an array item in a deeply nested object", () => {
    const obj = {
      object: {
        level1: {
          array: [1, 2, 3]
        }
      }
    };

    const result = retrieveInternalValue(obj, "object.level1.array[1]");
    expect(result).toEqual(2);
  });

  test("can get in key off an object in a nested array", () => {
    const obj = {
      array: [
        {},
        {
          nested: [{}, {}, { final: true }]
        },
        {}
      ]
    };
    const result = retrieveInternalValue(obj, "array[1].nested[2].final");
    expect(result).toBeTruthy();
  });
});
