/* eslint-disable no-undef */
import retrieveInternalValue from '../../utils/retrieveInternalValue';

describe('picks off nested properties of object', () => {
  test('works on complex nested objects', () => {
    const dummyObj = {
      first: {
        second: {
          third: {
            array: [{}, { some: true }, {}],
            object: {
              array: [1, 2, 3]
            }
          }
        }
      }
    };

    const result = retrieveInternalValue(dummyObj, 'first.second.third.array[1]');
    const secondResult = retrieveInternalValue(dummyObj, 'first.second.third.object.array[1]');

    expect(result).toMatchObject({ some: true });
    expect(secondResult).toEqual(2);
  });

  test('return the nested object if it exists', () => {
    const dummyObj = {
      key: {
        nested: 'got it'
      }
    };

    expect(retrieveInternalValue(dummyObj, 'key.nested')).toEqual('got it');
  });

  test('can get item off a nested array', () => {
    const dummyObj = {
      root: {
        array: ['first', 'second', 'third']
      }
    };
    expect(retrieveInternalValue(dummyObj, 'root.array[2]')).toEqual('third');
  });

  test('returns empty object if the key doesnt exist', () => {
    const dummyObj = { a: 's[re' };

    expect(retrieveInternalValue(dummyObj, 'name')).toBeUndefined();
  });
});
