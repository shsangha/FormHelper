import replace from "../../multiFieldHelpers/replace";

describe("tests the replacement of a value works as expected", () => {
  test("works on value arrays", () => {
    const val = [1, 2, 3];

    const result = replace([])(val, 1, 800);
    expect(result[1]).toEqual(800);
  });

  test("can replace the errors object", () => {
    const obj = {
      1: 1,
      2: 2
    };

    const result = replace({})(obj, 1, 2);
    expect(result[1]).toEqual(2);
  });

  test("sets a new value if it wasnt present before", () => {
    const obj = {
      1: 1,
      2: 2
    };

    const result = replace({})(obj, 3, 2);
    expect(result[3]).toEqual(2);
  });
});
