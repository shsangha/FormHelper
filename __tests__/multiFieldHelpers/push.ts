import pushValue from "../../multiFieldHelpers/push";

test("pushes new item to value array, dont need to test error/touced since this function doesnt change either of those states", () => {
  const valArray = [1, 2, 3];

  const result = pushValue(valArray, 4);
  expect(result.length).toEqual(4);
  expect(result[3]).toEqual(4);
});
