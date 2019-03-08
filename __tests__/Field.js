/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'enzyme';
import FormHelper from '../index';
import Field from '../Field';

describe('tests the Field Component', () => {
  test('can override default implementations of on change/blur if needed', () => {
    const fakeFieldOnChange = jest.fn();

    const wrapper = mount(
      <FormHelper>
        {() => (
          <Field name="test">
            {({ field, inputHandlers }) => (
              <input
                id="test-input"
                {...field}
                {...inputHandlers({
                  onChange: fakeFieldOnChange
                })}
              />
            )}
          </Field>
        )}
      </FormHelper>
    );

    const instance = wrapper.instance();

    const internalHandleChangeSpy = jest.spyOn(instance, 'handleChange');
    const inhernalHandleBlurSpy = jest.spyOn(instance, 'handleBlur').mockImplementation(() => {});

    const input = wrapper.find('#test-input');
    input.simulate('change');
    expect(fakeFieldOnChange).toHaveBeenCalled();
    expect(internalHandleChangeSpy).not.toHaveBeenCalled();
    input.simulate('blur');
    expect(inhernalHandleBlurSpy).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  test('passes through the specfic error and touched state relevant to the field', () => {
    const wrapper = mount(
      <FormHelper>
        {() => (
          <Field name="test">
            {({ field, inputHandlers }) => (
              <input id="test-input" {...field} {...inputHandlers()} />
            )}
          </Field>
        )}
      </FormHelper>
    );
  });

  test.only('passes the correct props into the Field', () => {
    const wrapper = mount(
      <FormHelper initialValues={{ test: 'any value' }}>
        {() => (
          <Field name="test">
            {({ field, inputHandlers }) => (
              <input id="test-input" {...field} {...inputHandlers()} />
            )}
          </Field>
        )}
      </FormHelper>
    );

    wrapper.setState(
      {
        errors: {
          test: 'some error'
        },
        touched: {
          test: true
        }
      },
      () => {
        const input = wrapper.find('#test-input').props();
        expect(input).toMatchObject({
          id: 'test-input',
          value: 'any value',
          type: 'text',
          name: 'test'
        });
        wrapper.unmount();
      }
    );
  });
});
