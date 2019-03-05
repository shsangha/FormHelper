/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests that form level validation runs as expected', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('sets form level error and returns state as is on error', () => {
    const validate = jest.fn(() => {
      throw new Error('TEST ERROR');
    });

    const wrapper = shallow(<FormHelper validate={validate}>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const fakeErrState = {
      first: 'dfsd',
      second: 'ekjwe'
    };

    const fakeValues = {
      some: 'values'
    };

    wrapper.setState(
      {
        errors: fakeErrState,
        values: fakeValues
      },
      () => {
        instance.runFormLevelValidation().then(response => {
          expect(response).toMatchObject(fakeErrState);
          expect(validate).toHaveBeenCalledTimes(1);
          expect(validate).toHaveBeenCalledWith(fakeValues);
          expect(wrapper.state('formErrors')[0]).toEqual('TEST ERROR');
        });
      }
    );
  });

  test('returns the result of top level form validaiton if no error was detected', () => {
    const validate = jest.fn(() => ({ validation: 'result' }));

    const wrapper = shallow(<FormHelper validate={validate}>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.runFormLevelValidation().then(response => {
      expect(response).toMatchObject({ validation: 'result' });
    });
  });
});
