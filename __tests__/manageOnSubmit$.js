/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import { of, VirtualTimeScheduler } from 'rxjs';
import { delay } from 'rxjs/operators';
import FormHelper from '../index';

describe('tests the submission stream', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('properly sets isValidating state at the start and end of the pipeline', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeSubmit = of({});

    jest.spyOn(instance, 'runAllFieldLevelValidations').mockImplementation(() => ({}));
    jest.spyOn(instance, 'runFormLevelValidation').mockImplementation(() => ({}));

    const setStateSpy = jest.spyOn(instance, 'setState');
    instance.manageOnSubmit$(fakeSubmit).subscribe({
      next() {},
      complete() {
        try {
          expect(setStateSpy).toHaveBeenCalledTimes(3);
          expect(setStateSpy).toHaveBeenNthCalledWith(1, { isValidating: true });
          expect(setStateSpy).toHaveBeenNthCalledWith(3, { isValidating: false, errors: {} });
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
  });

  test('only calls next if the error object passed through is empty', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeSubmit = of({});
    jest.spyOn(instance, 'runAllFieldLevelValidations').mockImplementation(() => ({}));
    jest
      .spyOn(instance, 'runFormLevelValidation')
      .mockImplementation(() => ({ nonEmptyError: 'soemthing' }));
    const onNextSpy = jest.fn();

    instance.manageOnSubmit$(fakeSubmit).subscribe({
      next() {
        onNextSpy();
      },
      complete() {
        try {
          expect(onNextSpy).toHaveBeenCalledTimes(0);
          done();
        } catch (e) {
          done.fail(e);
        }
      }
    });
  });

  test('sets all fields to touched', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeSubmit = of({});

    instance.fieldValidators = {
      object: '',
      with: '',
      some: '',
      keys: ''
    };

    jest.spyOn(instance, 'runAllFieldLevelValidations').mockImplementation(() => ({}));
    jest.spyOn(instance, 'runFormLevelValidation').mockImplementation(() => ({}));

    instance.manageOnSubmit$(fakeSubmit).subscribe({
      complete() {
        try {
          wrapper.update();
          expect(wrapper.state('touched')).toMatchObject({
            object: true,
            with: true,
            some: true,
            keys: true
          });
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
  });

  test('combines the errors from field and form level validation as expected', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeSubmit = of({});

    jest
      .spyOn(instance, 'runAllFieldLevelValidations')
      .mockImplementation(() => ({ some: { nested: { error: 'object' } } }));
    jest
      .spyOn(instance, 'runFormLevelValidation')
      .mockImplementation(() => ({ some: { nested: { other: 'error' } }, other: 'error' }));

    instance.manageOnSubmit$(fakeSubmit).subscribe({
      complete() {
        try {
          wrapper.update();
          expect(wrapper.state('errors')).toMatchObject({
            other: 'error',
            some: { nested: { error: 'object', other: 'error' } }
          });
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
  });

  test('swtichMaps over repeated calls to submit so we arent calling setState more than needed', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const scheduler = new VirtualTimeScheduler();
    const fakeSubmit = of(1, 2, 3, 4, 5, 6, 7, 8, 9);
    jest.spyOn(instance, 'runAllFieldLevelValidations').mockImplementation(() => ({}));
    jest
      .spyOn(instance, 'runFormLevelValidation')
      .mockImplementation(() => of({}).pipe(delay(300, scheduler)));

    const nextCalledSpy = jest.fn();

    instance.manageOnSubmit$(fakeSubmit).subscribe({
      next() {
        nextCalledSpy();
      },
      complete() {
        try {
          expect(nextCalledSpy).toHaveBeenCalledTimes(1);
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
    scheduler.flush();
  });

  test.only('errors are caught properly even though this should never actually happen', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeSubmit = of({});

    jest.spyOn(instance, 'runAllFieldLevelValidations').mockImplementation(() => ({}));
    jest.spyOn(instance, 'runFormLevelValidation').mockImplementation(() => {
      throw new Error('ANY ERROR');
    });

    const setFormLevelErrorSpy = jest.spyOn(instance, 'setFormLevelError');
    const nextCalledSpy = jest.fn();

    wrapper.setState(
      {
        errors: { some: { non: { empty: 'obj' } } }
      },
      () => {
        instance.manageOnSubmit$(fakeSubmit).subscribe({
          next() {
            nextCalledSpy();
          },
          complete() {
            try {
              expect(setFormLevelErrorSpy).toHaveBeenCalledTimes(1);
              expect(nextCalledSpy).toHaveBeenCalledTimes(0);
              done();
            } catch (error) {
              done.fail(error);
            }
          }
        });
      }
    );
  });
});
