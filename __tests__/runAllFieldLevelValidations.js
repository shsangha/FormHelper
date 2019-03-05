/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests that all field validations can be run in parallel and combined', () => {
  test('combined validation results from all fields and filters out nulls', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      first: {
        validator: jest.fn(() => null)
      },
      second: {
        validator: jest.fn(() => ({ some: 'error' }))
      },
      third: {
        validator: jest.fn(() => ({ other: 'error' }))
      }
    };

    instance.runAllFieldLevelValidations().then(response => {
      expect(instance.fieldValidators.first.validator).toHaveBeenCalledTimes(1);
      expect(instance.fieldValidators.second.validator).toHaveBeenCalledTimes(1);
      expect(instance.fieldValidators.third.validator).toHaveBeenCalledTimes(1);
      expect(response).toMatchObject({ second: { some: 'error' }, third: { other: 'error' } });
    });
  });
});
