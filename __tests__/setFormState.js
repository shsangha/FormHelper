/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('makes sure setState is called', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  expect(wrapper.state('values')).toMatchObject({});
  instance.setFormState({
    values: 'CHANGED'
  });
  wrapper.update();
  expect(wrapper.state('values')).toEqual('CHANGED');
});
