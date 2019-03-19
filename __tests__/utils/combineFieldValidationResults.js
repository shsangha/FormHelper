/* eslint-disable no-undef */
import combineFieldValidationResults from '../../utils/combineFieldValidationResults';

describe('tests that results from field validations are returned as a combined object', () => {
  test('handles case where multiField root also is validated', () => {
    // dependent on multiField root validation working as expected

    const keys = ['one', 'one[1]', 'one[2]'];
    const errors = [{ one: { some: 'error' } }, { some: 'error' }, { some: 'error' }];

    const result = combineFieldValidationResults(keys, errors);

    expect(result).toEqual(
      expect.objectContaining({
        one: {
          1: {
            some: 'error'
          },
          2: {
            some: 'error'
          },
          one: {
            some: 'error'
          }
        }
      })
    );
  });

  test('returns the combined object of all the field errors', () => {
    const keys = ['one', 'two', 'three'];

    const errors = [{ first: 'error' }, { second: 'error' }, { third: 'error' }];

    const result = combineFieldValidationResults(keys, errors);

    expect(result).toEqual(
      expect.objectContaining({
        one: errors[0],
        two: errors[1],
        three: errors[2]
      })
    );
  });

  test('filters out the validators that return null', () => {
    const keys = ['one', 'two', 'three'];
    const errors = [{ exists: true }, null, { exists: true }];

    const result = combineFieldValidationResults(keys, errors);

    expect(Object.keys(result).length).toEqual(2);
    expect(result.two).toBeUndefined();
  });
});
