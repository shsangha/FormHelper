import runAll from "../../utils/runAll";

describe("tests runall util func", () => {
  test("ignores non function values and doesnt break", () => {
    const fn = jest.fn();

    const fnArray = [{}, null, fn];

    runAll<string>(...fnArray)("doesnt matter");

    expect(fn).toHaveBeenCalled();
  });

  test("calls all functions in array with the same argument", () => {
    const func = jest.fn(() => {});
    const func2 = jest.fn(() => {});
    const arg = "ANYTHING";

    const fnArray = [func, func2];

    runAll<string>(...fnArray)("ANYTHING");

    expect(func).toHaveBeenCalled();
    expect(func2).toHaveBeenCalledWith(arg);
  });
});
