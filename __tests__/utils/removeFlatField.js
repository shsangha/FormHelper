/* eslint-disable no-undef */
import removeFlatField from '../../utils/removeFlatField';

test('returns the object with the field at the given key removed', () => {
  const fakeObj = {
    key1: 'stay',
    key2: 'remove',
    key3: 'stay'
  };

  expect(removeFlatField(fakeObj, 'key2')).toEqual(
    expect.objectContaining({
      key1: 'stay',
      key3: 'stay'
    })
  );
});
