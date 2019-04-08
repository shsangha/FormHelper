import targetInnerVal from "../../utils/targetInnerVal";

describe("tests to make sure we can grab inner values", () => {
  test("returns the expected target and the index as its index in the path array", () => {
    const obj = {
      some: {
        key: {
          array: [
            1,
            2,
            3,
            {
              fourth: {
                item: true
              }
            }
          ]
        }
      }
    };

    const arr = ["some", "key", "array", "3", "item"];

    const result = targetInnerVal(obj, arr);
    expect(result).toMatchObject({
      target: { fourth: { item: true } },
      index: 4
    });
  });

  test("returns an empty object as the target if non existent", () => {
    const obj = {};
    const arr = ["some", "key"];

    const result = targetInnerVal(obj, arr);
    expect(result).toEqual({
      target: {},
      index: 1
    });
  });
});
