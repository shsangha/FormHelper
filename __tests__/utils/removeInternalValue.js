/* eslint-disable no-undef */
import removeInternalValue from '../../utils/removeInternalValue';

describe('tests that when a field is removed the key is removed from state', () => {
  test('works with deeply nested complex objects', () => {
    const fakeObj = {
      first: {
        second: {
          third: [
            { one: 'one' },
            {
              two: {
                delete: true
              }
            },
            { three: 'three' }
          ]
        },
        keep: { stay: true }
      }
    };

    const result = removeInternalValue(fakeObj, 'first.second.third[1].two.delete');
    expect(result).toMatchObject({
      first: {
        second: {
          third: [
            {
              one: 'one'
            },
            {
              two: {}
            },
            {
              three: 'three'
            }
          ]
        },
        keep: {
          stay: true
        }
      }
    });

    const secondResult = removeInternalValue(result, 'first.second.third[1]');
    expect(secondResult).toMatchObject({
      first: {
        second: {
          third: [
            {
              one: 'one'
            },
            {
              three: 'three'
            }
          ]
        },
        keep: {
          stay: true
        }
      }
    });
  });

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

  test('works with arrays', () => {
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
