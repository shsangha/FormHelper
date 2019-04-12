import {
  unshiftValues,
  unshiftErrorsOrTouched
} from "../../multiFieldHelpers/unshift";

describe("tests that fields can be added to the front of an array", () => {
  test("works with values", () => {
    const values = [1, 2, 3];

    const result = unshiftValues(values, 0);

    expect(result.length).toEqual(4);
    expect(result[0]).toEqual(0);
  });

  test("works with errors/touched state", () => {
    const values = {
      0: { error: 0 },
      1: { error: 1 },
      2: { error: 2 }
    };

    const result = unshiftErrorsOrTouched(values);
    expect(result[0]).toBeUndefined();
    expect(result).toMatchObject({
      "1": {
        error: 0
      },
      "2": {
        error: 1
      }
    });
  });
});
