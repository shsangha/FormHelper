/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('sets state back to the initial state', () => {
  const initialValues = {
    some: 'initial',
    values: true
  };

  const wrapper = shallow(<FormHelper initialValues={initialValues}>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  wrapper.setState(
    {
      values: {},
      errors: { some: 'errors' },
      touched: { key1: true, key3: false },
      isValidating: true,
      isSubmitting: true,
      formErrors: [1, 2, 3, 4, 5]
    },
    () => {
      instance.resetForm();
      wrapper.update();
      expect(wrapper.state('values')).toEqual(expect.objectContaining(initialValues));
      expect(wrapper.state('touched')).toEqual({});
      expect(wrapper.state('errors')).toEqual({});
      expect(wrapper.state('isValidating')).toEqual(false);
      expect(wrapper.state('isSubmitting')).toEqual(false);
      expect(wrapper.state('formErrors').length).toEqual(0);
    }
  );
});
