/* eslint-disable no-undef */
import flatSetTouched from '../../utils/flatSetTouched';

test('returs an object with all the keys being valiated set to true to we can pass that into setState before submit', () => {
  const validatorKeys = ['first', 'second', 'third', 'first.a'];

  const result = flatSetTouched(validatorKeys);

  expect(result.first).toEqual(true);
  expect(result.second).toEqual(true);
  expect(result.third).toEqual(true);
  expect(result['first.a']).toEqual(true);
});
