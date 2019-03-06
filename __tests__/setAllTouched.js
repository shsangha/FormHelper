/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('all fields with validation are touched after setAllTouched runs', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  instance.fieldValidators = {
    key1: {},
    key2: {},
    key3: {}
  };

  expect(wrapper.state('touched')).toMatchObject({});
  instance.setAllTouched();
  wrapper.update();

  expect(wrapper.state('touched')).toMatchObject({
    key1: true,
    key2: true,
    key3: true
  });
});
