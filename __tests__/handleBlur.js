/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests blur validation stream is triggered when it is meant to be', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('called when the blurred field is a validated field', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const triggerSpy = jest.spyOn(instance, 'triggerFieldBlur$').mockImplementation(() => {});

    const fakeEvent = {
      currentTarget: {
        name: 'testField',
        value: 'irrelevant'
      }
    };

    instance.fieldValidators = {
      testField: {
        validator: jest.fn(),
        validateOnBlur: true
      }
    };

    instance.handleBlur(fakeEvent);
    expect(triggerSpy).toHaveBeenCalled();
  });
  test('dont need to keep track of touched state for non-validated fields so do nothing if the field isnt validated', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const triggerSpy = jest.spyOn(instance, 'triggerFieldBlur$').mockImplementation(() => {});

    const fakeEvent = {
      currentTarget: {
        name: 'testField',
        value: 'irrelevant'
      }
    };

    instance.fieldValidators = {
      testField: {
        validator: jest.fn(),
        validateOnBlur: false
      }
    };

    instance.handleBlur(fakeEvent);
    expect(triggerSpy).not.toHaveBeenCalled();
  });
});
