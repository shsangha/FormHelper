/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('field validation is detached when called', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  instance.fieldValidators = {
    test: {
      validator: () => {},
      validateOnChange: false,
      validateOnBlur: false
    }
  };

  instance.detachFieldValidator('test');

  expect(instance.fieldValidators).toMatchObject({});
});
