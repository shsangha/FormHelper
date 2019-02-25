/* eslint-disable no-undef */
import flatCombineFieldValidator from '../../utils/flatCombineFieldValidators';

test('filters out empty error objects and returns the remaining error object', () => {
  const validatorKeys = ['a', 'a.b', 'a.b.c[3]'];
  const errors = [{}, { exists: true }, { someString: 'string' }];

  const result = flatCombineFieldValidator(validatorKeys, errors);

  expect(result.a).toBeUndefined();
  expect(result['a.b']).toMatchObject({ exists: true });
  expect(result['a.b.c[3]']).toMatchObject({ someString: 'string' });
});
