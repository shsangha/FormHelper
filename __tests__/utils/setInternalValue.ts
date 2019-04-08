import set from "../../utils/set";
const { setInternalValue, setInternalError, setInternalTouched } = set;

describe("tests the setInternalValue method", () => {
  test("creates new paths properly if creating a new item in the object", () => {
    const obj = {};

    const value = "val";

    const result = setInternalValue(obj, "new.value.in.array[0]", value);
    expect(result).toMatchObject({
      new: {
        value: {
          in: {
            array: ["val"]
          }
        }
      }
    });
  });

  test("works with nested arrays", () => {
    const obj = {
      nestedObject: {
        array: [{ nestedArray: [1, 2, 3] }]
      }
    };

    const result = setInternalValue(
      obj,
      "nestedObject.array[0].nestedArray[1]",
      false
    );

    expect(result).toMatchObject({
      nestedObject: {
        array: [
          {
            nestedArray: [1, false, 3]
          }
        ]
      }
    });
  });

  test("works on nested objects", () => {
    const obj = {
      nested: {
        level2: {
          a: true,
          n: true,
          c: true
        }
      }
    };

    const result = setInternalValue(obj, "nested.level2.n", false);
    expect(result).toMatchObject({
      nested: {
        level2: {
          a: true,
          n: false,
          c: true
        }
      }
    });
  });
  test("works with array of objects", () => {
    const obj = {
      nested: {
        array: [{ stay: "here" }, { modify: true }],
        other: true
      }
    };
    const result = setInternalValue(obj, "nested.array[1]", { new: true });
    expect(result).toMatchObject({
      nested: {
        array: [
          {
            stay: "here"
          },
          {
            new: true
          }
        ],
        other: true
      }
    });
  });
});
