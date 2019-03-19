/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../../index';
import checkValidValidatorFunc from '../../utils/checkValidValidatorFunc';

describe('tests that the field uses validation and a function was passed in', () => {
  test('returns false if the validtor passed isnt a funciton', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      testKey: {
        validator: {}
      }
    };

    expect(checkValidValidatorFunc.call(instance, 'testKey')).toEqual(false);
  });
  test('returns false if the field doesnt use validation ', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    expect(checkValidValidatorFunc.call(instance, 'testKey')).toEqual(false);
  });

  test('returns true if the field uses validation and validator is a function ', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      testKey: {
        validator: jest.fn()
      }
    };

    expect(checkValidValidatorFunc.call(instance, 'testKey')).toEqual(true);
  });
});
