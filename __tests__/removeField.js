/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests to remove dyamic fields from the form', () => {
  test('removes the field from relevant state', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const initFakeState = {
      values: {
        keyToDelete: 'go away',
        keyToStay: 'stay'
      },
      errors: {},
      touched: { keyToDelete: true }
    };

    wrapper.setState({ ...initFakeState }, () => {
      instance.removeField('keyToDelete');
      wrapper.update();
      expect(wrapper.state('values')).not.toMatchObject(initFakeState.values);
      expect(wrapper.state('errors')).toMatchObject(initFakeState.errors);
      expect(wrapper.state('touched')).toMatchObject({});
      expect(wrapper.state('values')).toEqual(
        expect.not.objectContaining({ keyToDelete: 'go away' })
      );
    });
  });

  test('can remove a deeply nested object', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    wrapper.setState(
      {
        values: {
          first: {
            second: {
              keep: '',
              delete: {
                object: {}
              }
            }
          }
        }
      },
      () => {
        instance.removeField('first.second.delete.object');
        wrapper.update();
        expect(wrapper.state('values').first.second.keep).toEqual('');
        expect(wrapper.state('values').first.second.delete.object).toBeUndefined();
      }
    );
  });

  test('returns the state as is if no such field exists', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    const fakeInitState = {
      values: { somekey: 'some value' },
      errors: { generic: 'error' },
      touched: { shouldnt: 'change' }
    };

    wrapper.setState({ ...fakeInitState }, () => {
      instance.removeField('not-here');
      wrapper.update();
      expect(wrapper.state()).toMatchObject({
        errors: { generic: 'error' },
        formErrors: [],
        isSubmitting: false,
        isValidating: false,
        touched: { shouldnt: 'change' },
        values: { somekey: 'some value' }
      });
    });
  });
});
