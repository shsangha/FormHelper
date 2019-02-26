/* eslint-disable no-undef */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-unused-vars */
import React from 'react';
import { shallow } from 'enzyme';
import { of, NEVER } from 'rxjs';
import { share } from 'rxjs/operators';
import { fakeSchedulers } from 'rxjs-marbles/jest';
import FormHelper from '../index';

describe('tests the onChange$ ', () => {
  const name = 'test';
  const fakeErrorObj = { errorKey: 'someVal' };
  const syncValidationFunc = () => ({ errorKey: 'someVal' });
  const asyncValidationFunc = () =>
    new Promise(res => res()).then(
      () =>
        new Promise(resolve => {
          setTimeout(() => resolve(fakeErrorObj), 300);
        })
    );

  beforeEach(() => {
    jest.useFakeTimers();

    jest.resetAllMocks();
  });

  test('corretly filters to swichMap/mergeMap depending on the name passed in', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    //  const validationSpy = jest.spyOn(instance, 'runFieldLevelValidation');

    const fakeName1 = 'fake1';
    const fakeName2 = 'fake2';
    const value = 'irrevant';

    const fakeOnChange = of([
      { name: fakeName1, value },
      { name: fakeName2, value },
      { name: fakeName1, value },
      { name: fakeName1, value }
    ]).pipe(share());

    const fakeOnBlur = NEVER;

    instance.fieldValidators[fakeName1] = { validator: asyncValidationFunc };
    instance.fieldValidators[fakeName2] = { validator: asyncValidationFunc };

    instance
      .manageOnChange$(fakeOnChange, fakeOnBlur)
      .subscribe(([error, key]) => {
        expect(error).toMatchObject({ errorKey: 'soddmeVal' });
        expect(key).toEqual('test');
      })
      .unsubscribe();
  });

  test('runs sycronous validation as expected', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeOnChange = of([{ name: null }, { name, value: 'fake' }]).pipe(share());
    const fakeOnBlur = NEVER;

    instance.fieldValidators[name] = { validator: syncValidationFunc };

    instance
      .manageOnChange$(fakeOnChange, fakeOnBlur)
      .subscribe(([error, key]) => {
        expect(error).toMatchObject({ errorKey: 'someVal' });
        expect(key).toEqual('test');
      })
      .unsubscribe();
  });

  test.only(
    'capable of running async validation',
    fakeSchedulers(advance => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const fakeOnChange = of([{ name: null }, { name, value: 'fake' }]).pipe(share());
      const fakeOnBlur = NEVER;

      instance.fieldValidators[name] = { validator: syncValidationFunc };

      instance.manageOnChange$(fakeOnChange, fakeOnBlur).subscribe(c => console.log(c));
      advance(400);
      wrapper.update();
    })
  );
});
