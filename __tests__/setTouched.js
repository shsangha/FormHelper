/* eslint-disable no-undef */
/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('makes sure touched state is set for a given key', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  expect(wrapper.state('touched')).toMatchObject({});

  instance.setTouched('test');

  wrapper.update();
  expect(wrapper.state('touched')).toMatchObject({ test: true });
});
