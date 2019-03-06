/* eslint-disable no-undef */
/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

test('can remove an error from the errors array', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  wrapper.setState(
    {
      formErrors: [1, 9, 1]
    },
    () => {
      instance.removeFormLevelError(1);
      wrapper.update();

      expect(wrapper.state('formErrors')).toEqual(expect.arrayContaining([1, 1]));

      instance.removeFormLevelError(1);
      wrapper.update();

      expect(wrapper.state('formErrors')).toEqual(expect.arrayContaining([1]));
    }
  );
});
