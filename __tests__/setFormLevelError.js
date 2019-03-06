/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests to make sure formLevel errors can be added to as expected', () => {
  test('limits the errors to three so there arent too many toast notifications floating arount', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    wrapper.setState(
      {
        formErrors: [1, 2, 3]
      },
      () => {
        instance.setFormLevelError('new error');
        wrapper.update();
        expect(wrapper.state('formErrors')).toHaveLength(3);
        expect(wrapper.state('formErrors')[2]).toEqual('new error');
      }
    );
  });
});
