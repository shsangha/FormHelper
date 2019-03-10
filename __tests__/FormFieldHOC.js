/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { mount } from 'enzyme';
import FormFieldHOC from '../FormFieldHOC';
import { FormContext } from '../index';

describe('tests the common functionality between both Field types', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('igores attaching/detaching validators when the field doesnt need them', () => {
    // need to do this bc enzyme does not support createContext() yet
    const fakeContext = {
      attachFieldValidator: jest.fn(),
      detachFieldValidator: jest.fn(),
      cleanUpField: jest.fn()
    };

    const FakeField = FormFieldHOC(() => <div />);

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
      cleanUpField: jest.fn()
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

  test('passes the props and the context through as expected', () => {
    const fakeContext = {
      attachFieldValidator: jest.fn(),
      detachFieldValidator: jest.fn(),
      cleanUpField: jest.fn()
    };
    const FakeField = FormFieldHOC(() => <div />);

    const wrapper = mount(
      <FormContext.Provider value={fakeContext}>
        <FakeField name="" />
      </FormContext.Provider>
    );
    const inner = wrapper.childAt(0);
    expect(inner.props()).toEqual(
      expect.objectContaining({
        attachFieldValidator: expect.any(Function),
        cleanUpField: expect.any(Function),
        detachFieldValidator: expect.any(Function),
        dynamic: false,
        name: '',
        validateOnBlur: true,
        validateOnChange: true
      })
    );
    wrapper.unmount();
  });
});
