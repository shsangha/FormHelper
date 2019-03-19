/* eslint-disable no-undef */
import removeInternalValue from '../../utils/removeInternalValue';

describe('tests that when a field is removed the key is removed from state', () => {
  test('works with objects', () => {
    const fakeObj = {
      key1: {
        nested: {
          deleteMe: 'some string',
          keepMe: 'other string'
        }
      }
    };

    const result = removeInternalValue(fakeObj, 'key1.nested.deleteMe');
    expect(result.nested).not.toEqual(expect.objectContaining({ deleteMe: 'some string' }));
    expect(result).toMatchObject({
      key1: {
        nested: {
          keepMe: 'other string'
        }
      }
    });
  });

  test.only('works with arrays', () => {
    const fakeObject = {
      key1: {
        nested: {
          array: [1, 2, 3]
        }
      }
    };

    expect(removeInternalValue(fakeObject, 'key1.nested.array[1]').key1.nested.array).toEqual(
      expect.arrayContaining([1, 3])
    );
  });
});
