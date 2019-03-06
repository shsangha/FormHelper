/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests that form submission works as expected', () => {
  test('submits when there are no errors', () => {
    const onSubmit = jest.fn();
    const wrapper = shallow(<FormHelper onSubmit={onSubmit}>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.handleSubmit();
    wrapper.update();
    expect(onSubmit).toHaveBeenCalled();
  });

  test('does nothing if there are errors', () => {
    const onSubmit = jest.fn();
    const wrapper = shallow(<FormHelper onSubmit={onSubmit}>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    wrapper.setState(
      {
        errors: { not: 'empty' }
      },
      () => {
        instance.handleSubmit();
        wrapper.update();
        expect(onSubmit).not.toHaveBeenCalled();
      }
    );
  });
});
