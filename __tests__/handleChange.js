/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests the default handleChange function', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('triggers validation when the field being changed requries it', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      testField: {
        validator: jest.fn(),
        validateOnChange: true
      }
    };

    const fakeEvent = {
      currentTarget: {
        name: 'testField',
        value: 'any value',
        type: 'text',
        checked: false
      }
    };

    const validationSpy = jest.spyOn(instance, 'triggerFieldChange$').mockImplementation(() => {});

    instance.handleChange(fakeEvent);
    wrapper.update();
    expect(validationSpy).toHaveBeenCalledTimes(1);
  });

  test('does not trigger validation if the field does not need validation', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      testField: {
        validator: jest.fn(),
        validateOnChange: false
      }
    };

    const fakeEvent = {
      currentTarget: {
        name: 'testField',
        value: 'any value',
        type: 'text',
        checked: false
      }
    };

    const validationSpy = jest.spyOn(instance, 'triggerFieldChange$').mockImplementation(() => {});

    instance.handleChange(fakeEvent);
    wrapper.update();
    expect(validationSpy).toHaveBeenCalledTimes(0);
  });

  test('uses checked instead of value for checkboxes', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const fakeEvent = {
      currentTarget: {
        name: 'testField',
        value: 'any value',
        type: 'checkbox',
        checked: true
      }
    };

    const fakeEvent2 = {
      currentTarget: {
        name: 'testField',
        value: 'any value',
        type: 'checkbox',
        checked: false
      }
    };

    instance.handleChange(fakeEvent);
    wrapper.update();
    expect(wrapper.state('values').testField).toEqual(true);
    instance.handleChange(fakeEvent2);
    wrapper.update();
    expect(wrapper.state('values').testField).toEqual(false);
  });

  test('makes sure state is set for fields that dont return boolean values', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const fakeEvent = {
      currentTarget: {
        name: 'testField',
        value: 'any value',
        type: 'text',
        checked: false
      }
    };

    instance.handleChange(fakeEvent);
    wrapper.update();
    expect(wrapper.state('values')).toMatchObject({ testField: 'any value' });
  });
});
