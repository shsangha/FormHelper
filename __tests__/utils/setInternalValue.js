/* eslint-disable no-undef */
import setInternalValue from '../../utils/setInternalValue';

describe('tests the ability to set properties on nested object', () => {
  test('works as expected when setting shallow state on a key that exists', () => {
    const testObj = {
      replaced: false
    };

    const result = setInternalValue(testObj, 'replaced', true);

    expect(result.replaced).toEqual(true);
  });

  test('can create a new key shallow', () => {
    const testObj = {
      firstKey: 'anthing'
    };

    const result = setInternalValue(testObj, 'newKey', true);

    expect(Object.keys(result).length).toEqual(2);
    expect(result.newKey).toEqual(true);
  });

  test('can create an array if needed', () => {
    const testObj = {};

    const result = setInternalValue(testObj, 'newKey[0]', true);
    expect(result.newKey[0]).toEqual(true);
  });

  test('can set deeply nested poperty on an object', () => {
    const testObj = {
      nestedObject: {
        here: 'already'
      },
      nestedArray: {
        Array: [1, 2]
      }
    };

    let result = setInternalValue(testObj, 'nestedObject.newKey', 'newKey');
    result = setInternalValue(result, 'nestedArray.Array[2]', 3);
    expect(result).toMatchObject({
      nestedObject: {
        here: 'already',
        newKey: 'newKey'
      },
      nestedArray: {
        Array: [1, 2, 3]
      }
    });
  });
});
