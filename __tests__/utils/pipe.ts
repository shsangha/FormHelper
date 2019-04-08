import pipe from "../../utils/pipe";

test("pipes a number of functions together", () => {
  const one: (input: number) => number = jest.fn((a: number) => a + 3);
  const two: (input: number) => number = jest.fn((a: number) => a * 3);
  const three: (input: number) => number = jest.fn((a: number) => a - 3);

  expect(
    pipe(
      one,
      two,
      three
    )(7)
  ).toEqual(21);
  expect(one).toHaveBeenCalled();
  expect(two).toHaveBeenCalled();
  expect(three).toHaveBeenCalled();
});
