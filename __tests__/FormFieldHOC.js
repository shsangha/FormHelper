/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { mount, shallow } from 'enzyme';
import FormFieldHOC from '../FormFieldHOC';
import FormHelper, { FormContext } from '../index';
import Field from '../Field';

describe('tests the common functionality between both Field types', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('passes the props and the context through as expected', () => {
    const wrapper = mount(
      <FormHelper>{() => <Field name="test">{() => <div />}</Field>}</FormHelper>
    );

    wrapper.setState(
      {
        values: { test: 'some key' },
        errors: { test: 'some key' },
        touched: { test: true }
      },
      () => {
        wrapper.update();
        expect(
          wrapper
            .children()
            .children()
            .props()
        ).toMatchObject({
          name: 'test',
          children: expect.any(Function),
          validateOnChange: true,
          validateOnBlur: true,
          dynamic: false,
          addField: expect.any(Function),
          attachFieldValidator: expect.any(Function),
          detachFieldValidator: expect.any(Function),
          removeFormLevelError: expect.any(Function),
          runFormLevelValidation: expect.any(Function),
          runFieldLevelValidation: expect.any(Function),
          runAllFieldLevelValidations: expect.any(Function),
          handleBlur: expect.any(Function),
          handleChange: expect.any(Function),
          handleSubmit: expect.any(Function),
          resetForm: expect.any(Function),
          removeField: expect.any(Function),
          setAllTouched: undefined,
          setInternalValue: expect.any(Function),
          setInternalError: expect.any(Function),
          setInternalTouched: expect.any(Function),
          retrieveInternalValue: expect.any(Function),
          setTouched: expect.any(Function),
          setFormState: expect.any(Function),
          setFormLevelError: expect.any(Function),
          values: { test: 'some key' },
          touched: { test: true },
          errors: { test: 'some key' },
          isValidating: false,
          isSubmitting: false,
          formErrors: [],
          validateField: expect.any(Function),
          validateForm: expect.any(Function),
          FieldState: { value: 'some key', errors: 'some key', touched: true }
        });
      }
    );

    wrapper.unmount();
  });

  test('can pipe the validation properly when a multifield is used so that root validation doesnt overide the whole error object', () => {
    const fakeContext = {
      attachFieldValidator: jest.fn(),
      detachFieldValidator: jest.fn(),
      cleanUpField: jest.fn(),
      retrieveInternalValue: jest.fn(),
      errors: {
        test: {
          1: { existing: 'error' }
        }
      }
    };

    const FakeField = FormFieldHOC(() => <div />, true);

    const wrapper = mount(
      <FormContext.Provider value={fakeContext}>
        <FakeField name="test" />
      </FormContext.Provider>
    );

    const instance = wrapper.instance();

    const result = instance.pipeMultiFieldValidation(() => ({ new: 'error' }), 'test')();

    expect(result).toMatchObject({ 1: { existing: 'error' }, test: { new: 'error' } });
    wrapper.unmount();
  });

  test('can distingusish when pipeMultiField needs to be called', () => {
    const fakeContext = {
      attachFieldValidator: jest.fn(),
      detachFieldValidator: jest.fn(),
      cleanUpField: jest.fn(),
      retrieveInternalValue: jest.fn()
    };

    const FakeMultiField = FormFieldHOC(() => <div />, true);
    const FakeField = FormFieldHOC(() => <div />, false);

    const multiWrapper = mount(
      <FormContext.Provider value={fakeContext}>
        <FakeMultiField validator={jest.fn()} name="test" />
      </FormContext.Provider>
    );
    const singleWrapper = mount(
      <FormContext.Provider value={fakeContext}>
        <FakeField validator={jest.fn()} name="test" />
      </FormContext.Provider>
    );

    const multiInstance = multiWrapper.instance();
    const multiSpy = jest.spyOn(multiInstance, 'pipeMultiFieldValidation');
    expect(multiSpy).not.toHaveBeenCalled();
    multiInstance.componentDidMount();
    expect(multiSpy).toHaveBeenCalled();

    const singleInstance = singleWrapper.instance();
    const singleSpy = jest.spyOn(singleInstance, 'pipeMultiFieldValidation');
    expect(singleSpy).not.toHaveBeenCalled();
    singleInstance.componentDidMount();
    expect(singleSpy).not.toHaveBeenCalled();

    multiWrapper.unmount();
    singleWrapper.unmount();
  });

  test('igores attaching/detaching validators when the field doesnt need them', () => {
    // need to do this bc enzyme does not support createContext() yet
    const fakeContext = {
      attachFieldValidator: jest.fn(),
      detachFieldValidator: jest.fn(),
      cleanUpField: jest.fn(),
      retrieveInternalValue: jest.fn()
    };

    const FakeField = FormFieldHOC(() => <div />, true);

    const wrapper = mount(
      <FormContext.Provider value={fakeContext}>
        <FakeField name="" />
      </FormContext.Provider>
    );

    expect(fakeContext.attachFieldValidator).not.toHaveBeenCalled();
    wrapper.unmount();
    expect(fakeContext.detachFieldValidator).not.toHaveBeenCalled();
    expect(fakeContext.cleanUpField).not.toHaveBeenCalled();
  });

  test('calls attach/detach on field validators when the field is a validated field', () => {
    // need to do this bc enzyme does not support createContext() yet
    const fakeContext = {
      attachFieldValidator: jest.fn(),
      detachFieldValidator: jest.fn(),
      cleanUpField: jest.fn(),
      retrieveInternalValue: jest.fn()
    };
    const FakeField = FormFieldHOC(() => <div />);

    const wrapper = mount(
      <FormContext.Provider value={fakeContext}>
        <FakeField dynamic validator={jest.fn()} name="" />
      </FormContext.Provider>
    );
    expect(fakeContext.attachFieldValidator).toHaveBeenCalled();
    expect(fakeContext.detachFieldValidator).not.toHaveBeenCalled();
    wrapper.unmount();
    expect(fakeContext.detachFieldValidator).toHaveBeenCalled();
    expect(fakeContext.cleanUpField).toHaveBeenCalled();
  });
});
