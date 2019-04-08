import isEmptyObj from "../../utils/isEmptyObj";

describe("tests is a given object is empty", () => {
  test("returns true if the object is empty", () => {
    const dummyObj = {};

    expect(isEmptyObj(dummyObj)).toEqual(true);
  });

  test("returns false if there is anything in the object", () => {
    const dummyObj = { fakeItem: "" };

    expect(isEmptyObj(dummyObj)).toEqual(false);
  });

  test("returns false if what we passed in was not an object", () => {
    const dummyObj = "not an object";

    expect(isEmptyObj(dummyObj)).toEqual(false);
  });
});
