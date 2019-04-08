import removeInternalValue from "../../utils/removeInternalValue";

describe("tests values can be removed from complex objects", () => {
  test("arrays of objects", () => {
    const obj = {
      array: [
        { fist: "object" },
        { delete: { something: { from: "in", stay: true } } }
      ]
    };

    const result = removeInternalValue(obj, "array[1].delete.something.from");

    expect(result).toMatchObject({
      array: [
        {
          fist: "object"
        },
        {
          delete: {
            something: {
              stay: true
            }
          }
        }
      ]
    });
  });

  test("can delete from an array and presrve order", () => {
    const obj = {
      array: [
        { fisrst: "object" },
        { delete: true },
        { secondAfterDelete: true }
      ]
    };

    const result = removeInternalValue(obj, "array[1]");
    expect(result).toMatchObject({
      array: [
        {
          fisrst: "object"
        },
        {
          secondAfterDelete: true
        }
      ]
    });
  });

  test("returns the object as is if the index we try to delete didnt exist", () => {
    const obj = {
      array: [1, 2, 3],
      other: true
    };

    let result = removeInternalValue(obj, "array[3]");
    result = removeInternalValue(obj, "not here");

    expect(result).toMatchObject(obj);
  });
});
