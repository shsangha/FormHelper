import set from "../../utils/set";
const { setInternalValue, setInternalError, setInternalTouched } = set;

describe("tests setInternal value/error create objects for arrays keys instead of arrays", () => {
  test("create new keys properly when object does not exist", () => {
    const obj = {};

    const result = setInternalError(obj, "error.newKey.array[0]", true);
    expect(result).toMatchObject({
      error: {
        newKey: {
          array: {
            "0": true
          }
        }
      }
    });
  });
});
