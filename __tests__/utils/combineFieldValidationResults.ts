import combineFieldValidationResults from "../../utils/combineFieldValidationResults";

describe("tests that validation results get combined as expected", () => {
  test("ignores errors that are null", () => {
    const keys = ["one", "two", "three"];
    const errors = [null, null, null];

    const result = combineFieldValidationResults(keys, errors);
    expect(result).toMatchObject({});
  });

  test("overrides other errors when root error is last validated", () => {
    const keys = ["one[1]", "one[2]", "one"];
    const errors = [
      { some: "error" },
      { some: "error" },
      { one: { some: "error" } }
    ];

    const result = combineFieldValidationResults(keys, errors);

    expect(result).toMatchObject({
      one: {
        one: {
          some: "error"
        }
      }
    });
  });

  test("returns the expected result from a complex set of validators", () => {
    const keys = [
      "object",
      "array",
      "arrayOfObjects",
      "objectWithArrays",
      "arrayOfObjects[0]",
      "arrayOfObjects[1].a",
      "objectWithArrays.first[0]",
      "objectWithArrays.first[0].object"
    ];

    const errors = [
      { root: "objerror" },
      { root: "arrayError" },
      { root: "arrayOfObj" },
      { root: "objWithArr" },
      { nested: "arr of objects index 0" },
      { nested: "arr of objects index 0 obj" },
      { nested: "object with array first at 0" },
      { nested: "object with arrays first at 0 with obj" }
    ];

    const result = combineFieldValidationResults(keys, errors);

    expect(result).toMatchObject({
      object: {
        root: "objerror"
      },
      array: {
        root: "arrayError"
      },
      arrayOfObjects: {
        "0": {
          nested: "arr of objects index 0"
        },
        "1": {
          a: {
            nested: "arr of objects index 0 obj"
          }
        },
        root: "arrayOfObj"
      },
      objectWithArrays: {
        root: "objWithArr",
        first: {
          "0": {
            nested: "object with array first at 0",
            object: {
              nested: "object with arrays first at 0 with obj"
            }
          }
        }
      }
    });
  });
});
