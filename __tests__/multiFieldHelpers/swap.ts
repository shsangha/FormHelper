import swap from "../../multiFieldHelpers/swap";

describe("tests that two values in a fielArray can be swapped", () => {
  test("works for values", () => {
    const values = [1, 2, 3, 4, 5];
    const result = swap([])(values, 0, 4);

    expect(result).toMatchObject([5, 2, 3, 4, 1]);
  });

  test("works with touched/error states", () => {
    const values = {
      1: { value: "1" },
      2: { value: "2" },
      3: { value: "3" }
    };

    const result = swap({})(values, 1, 3);
    expect(result).toMatchObject({
      1: { value: "3" },
      2: { value: "2" },
      3: { value: "1" }
    });
  });
});
