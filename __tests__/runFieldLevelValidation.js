/* eslint-disable no-undef */
/* eslint-disable react/jsx-filename-extension */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests that field level validation returns expected results', () => {
  test('returns null if there is no errors to report', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      test: {
        validator: jest.fn(() => ({}))
      }
    };

    instance.runFieldLevelValidation('test', 'anything').then(returnVal => {
      expect(returnVal).toBeNull();
    });
  });

  test('returns an object with errors if validation picks up an error', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      test: {
        validator: jest.fn(() => ({ not: 'empty' }))
      }
    };

    instance.runFieldLevelValidation('test', 'anything').then(returnVal => {
      expect(returnVal).toMatchObject({ not: 'empty' });
    });
  });

  test('sets formLevel errors and returns current error state if an error is caught', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    instance.fieldValidators = {
      test: {
        validator: jest.fn(() => {
          throw new Error('TEST ERROR');
        })
      }
    };

    const initErrState = {
      some: {
        test: 'errors'
      },
      test: 'already here'
    };

    wrapper.setState(
      {
        errors: initErrState
      },
      () => {
        instance.runFieldLevelValidation('test', 'anything').then(returnVal => {
          expect(wrapper.state()).toMatchObject({
            values: {},
            touched: {},
            errors: { some: { test: 'errors' }, test: 'already here' },
            isValidating: false,
            isSubmitting: false,
            formErrors: ['TEST ERROR']
          });
        });
      }
    );
  });
});
