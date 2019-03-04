/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import { of, NEVER, VirtualTimeScheduler } from 'rxjs';
import { share, tap, concatMap, delay } from 'rxjs/operators';
import { observe } from 'rxjs-marbles/jest';
import FormHelper from '../index';

describe('tests that data flowing through the blur$ is handled as expected', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test('sets the state of the field to touched if it was not already touched', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const name = 'field';
    const fakeOnBlur = of({ name, value: 'fake' }).pipe(share());
    const fakeOnSubmit = NEVER;

    const touchedSpy = jest.spyOn(instance, 'setTouched');

    instance.manageOnBlur$(fakeOnBlur, fakeOnSubmit).subscribe({
      complete() {
        try {
          expect(touchedSpy).toHaveBeenCalledTimes(1);
          expect(touchedSpy).toHaveBeenCalledWith(name);
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });
  });

  test('inner obvservable can be interupted with takeUntil when submit triggerd', done => {
    const scheduler = new VirtualTimeScheduler();

    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeOnBlur = of(
      { name: 'any', value: 'any' } // should run
    ).pipe(share());

    const fakeOnSubmit = of(1).pipe(concatMap(x => of(x).pipe(delay(100, scheduler))));

    instance.runFieldLevelValidation = jest.fn(() =>
      of({ doesnt: 'matter' }).pipe(delay(150, scheduler))
    );

    const start = scheduler.now();

    const nextCalled = jest.fn();

    instance.manageOnBlur$(fakeOnBlur, fakeOnSubmit).subscribe(
      () => {
        nextCalled();
      },
      () => {},
      () => {
        try {
          expect(nextCalled).toHaveBeenCalledTimes(0);
          done();
        } catch (e) {
          done.fail(e);
        }
      }
    );

    scheduler.flush();
  });

  test(
    'returns the merged results from field and form level validation if no error is thrown',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const name = 'field';
      const fakeOnBlur = of({ name, value: 'fake' }).pipe(share());
      const fakeOnSubmit = NEVER;

      const fieldLevelSpy = jest
        .spyOn(instance, 'runFieldLevelValidation')
        .mockImplementation(() => of({ test: 'value' }));

      const formLevelSpy = jest
        .spyOn(instance, 'runFormLevelValidation')
        .mockImplementation(() => of({ form: 'value' }));
      return instance.manageOnBlur$(fakeOnBlur, fakeOnSubmit).pipe(
        tap(combinedObj => {
          expect(combinedObj).toMatchObject({ form: 'value', field: { test: 'value' } });
          expect(fieldLevelSpy).toHaveBeenCalledTimes(1);
          expect(formLevelSpy).toHaveBeenCalledTimes(1);
        })
      );
    })
  );

  test('removes the field from the errors object if there is no error', done => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const name = 'test';
    const fakeOnBlur = of({ name, value: 'fake' }).pipe(share());
    const fakeOnSubmit = NEVER;

    instance.runFieldLevelValidation = jest.fn(() => of(null));
    instance.runFormLevelValidation = jest.fn(() => of({ root: 'error' }));

    wrapper.setState(
      {
        errors: { test: 'some error' }
      },
      () => {
        instance.manageOnBlur$(fakeOnBlur, fakeOnSubmit).subscribe({
          next(x) {
            try {
              expect(x).toMatchObject({ root: 'error' });
            } catch (e) {
              done.fail(e);
            }
          },
          error() {},
          complete() {
            done();
          }
        });
      }
    );
  });

  test(
    'works with async validation',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const name = 'field';
      const fakeOnBlur = of({ name, value: 'fake' }).pipe(share());
      const fakeOnSubmit = NEVER;

      const fieldLevelSpy = jest
        .spyOn(instance, 'runFieldLevelValidation')
        .mockImplementation(() => new Promise(resolve => resolve({ test: 'value' })));

      const formLevelSpy = jest
        .spyOn(instance, 'runFormLevelValidation')
        .mockImplementation(() => new Promise(resolve => resolve({ form: 'value' })));
      return instance.manageOnBlur$(fakeOnBlur, fakeOnSubmit).pipe(
        tap(combinedObj => {
          expect(combinedObj).toMatchObject({ form: 'value', field: { test: 'value' } });
          expect(fieldLevelSpy).toHaveBeenCalledTimes(1);
          expect(formLevelSpy).toHaveBeenCalledTimes(1);
        })
      );
    })
  );

  /* This is also sufficent to test the asyc case since a throw error in a promise chain 
    without a catch clause would propogate the error up and return the same way as a syncronous error
    would
*/
  test(
    'returns the current state if there is an error, and adds the formLevel errors',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const name = 'test';
      const fakeOnBlur = of({ name, value: 'fake' }).pipe(share());
      const fakeOnSubmit = NEVER;

      const spy = jest.spyOn(instance, 'runFieldLevelValidation').mockImplementation(() => {
        throw new Error('error');
      });

      const setErrSpy = jest.spyOn(instance, 'setFormLevelError');

      return instance.manageOnBlur$(fakeOnBlur, fakeOnSubmit).pipe(
        tap(error => {
          expect(error).toMatchObject(wrapper.state().errors);
          expect(setErrSpy).toHaveBeenCalledTimes(1);
        })
      );
    })
  );
});
