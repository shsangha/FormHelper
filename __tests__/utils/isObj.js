/* eslint-disable no-undef */
import isObj from '../../utils/isObj';

describe('tests if a given value is an object', () => {
  test('catches false positives if null is passed in ', () => {
    expect(isObj(null)).toEqual(false);
  });

  test('passes if an actual object is given', () => {
    expect(isObj({})).toEqual(true);
  });

  test('fails normally if another primative is passed in', () => {
    expect(isObj('')).toEqual(false);
  });

  test('fails is a function is passed in', () => {
    expect(isObj(() => {})).toEqual(false);
  });

  test('fails if an array is passed', () => {
    expect(isObj([])).toEqual(false);
  });
});
