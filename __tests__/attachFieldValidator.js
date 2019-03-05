/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('makes sure that validator gets added to the instance field validators when called', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  expect(instance.fieldValidators).toMatchObject({});

  instance.attachFieldValidator('test', () => {}, true, false);

  expect(instance.fieldValidators).toMatchObject({
    test: {
      validator: expect.any(Function),
      validateOnChange: true,
      validateOnBlur: false
    }
  });
});
