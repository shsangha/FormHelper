/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import { of, NEVER } from 'rxjs';
import { share, tap } from 'rxjs/operators';
import { observe } from 'rxjs-marbles/jest';
import FormHelper from '../index';

describe('tests that data flowing through the blur$ is handled as expected', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test(
    'returns the merged results from field and form level validation if no error is thrown',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const name = 'field';
      const fakeOnChange = of({ name, value: 'fake' }).pipe(share());
      const fakeOnBlur = NEVER;

      const fieldLevelSpy = jest
        .spyOn(instance, 'runFieldLevelValidation')
        .mockImplementation(() => of({ test: 'value' }));

      const formLevelSpy = jest
        .spyOn(instance, 'runFormLevelValidation')
        .mockImplementation(() => of({ form: 'value' }));
      return instance.manageOnBlur$(fakeOnChange, fakeOnBlur).pipe(
        tap(combinedObj => {
          expect(combinedObj).toMatchObject({ form: 'value', field: { test: 'value' } });
          expect(fieldLevelSpy).toHaveBeenCalledTimes(1);
          expect(formLevelSpy).toHaveBeenCalledTimes(1);
        })
      );
    })
  );

  test(
    'works with async validation',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const name = 'field';
      const fakeOnChange = of({ name, value: 'fake' }).pipe(share());
      const fakeOnBlur = NEVER;

      const fieldLevelSpy = jest
        .spyOn(instance, 'runFieldLevelValidation')
        .mockImplementation(() => new Promise(resolve => resolve({ test: 'value' })));

      const formLevelSpy = jest
        .spyOn(instance, 'runFormLevelValidation')
        .mockImplementation(() => new Promise(resolve => resolve({ form: 'value' })));
      return instance.manageOnBlur$(fakeOnChange, fakeOnBlur).pipe(
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
      const fakeOnChange = of({ name, value: 'fake' }).pipe(share());
      const fakeOnBlur = NEVER;

      const spy = jest.spyOn(instance, 'runFieldLevelValidation').mockImplementation(() => {
        throw new Error('error');
      });

      const setErrSpy = jest.spyOn(instance, 'setFormLevelError');

      return instance.manageOnBlur$(fakeOnChange, fakeOnBlur).pipe(
        tap(error => {
          expect(error).toMatchObject(wrapper.state().errors);
          expect(setErrSpy).toHaveBeenCalledTimes(1);
        })
      );
    })
  );
});
