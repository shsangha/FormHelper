/* eslint-disable no-undef */
/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-unused-vars */
import React from 'react';
import { shallow } from 'enzyme';
import { of, NEVER, VirtualTimeScheduler, interval, merge } from 'rxjs';
import { share, tap, delay, take, concatMap } from 'rxjs/operators';
import { fakeSchedulers, observe } from 'rxjs-marbles/jest';
import FormHelper from '../index';

describe('tests the onChange$ ', () => {
  const name = 'test';
  const fakeErrorObj = { errorKey: 'someVal' };
  const syncValidationFunc = () => fakeErrorObj;
  const asyncValidationFunc = () => new Promise(res => res(fakeErrorObj));
  const fakeStart = { name: 'null' };
  const fake1 = { name: 'fake1', value: 'fake1' };
  const fake2 = { name: 'fake2', value: 'fake2' };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();
  });

  test('properly filters into switch/merge map depending on the previous name', done => {
    fakeSchedulers(advance => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();

      const spy = jest.spyOn(instance, 'runFieldLevelValidation').mockImplementation(() => {
        return of({ doesnt: 'matter' });
      });

      const fakeOnChange = of(
        [fakeStart, fake1], // should run
        [fake1, fake1], // should run
        [fake1, fake1],
        [fake1, fake1],
        [fake1, fake1],
        [fake1, fake2], // should run
        [fake2, fake2]
      ).pipe(share());
      const fakeOnBlur = NEVER;

      instance.manageOnChange$(fakeOnChange, fakeOnBlur).subscribe({
        next(x) {
          advance(100);
          wrapper.update();
        },
        error(err) {},
        complete(c) {
          try {
            expect(spy).toHaveBeenCalledTimes(3);
            expect(spy).toHaveBeenNthCalledWith(1, 'fake1', 'fake1');
            expect(spy).toHaveBeenNthCalledWith(2, 'fake1', 'fake1');
            expect(spy).toHaveBeenNthCalledWith(3, 'fake2', 'fake2');

            done();
          } catch (e) {
            done.fail(e);
          }
        }
      });
      advance(300);
      wrapper.update();
      jest.runAllTimers();
    })();
  });

  test.only('inner obvservable can be interupted with takeUntil when field blurs', () => {
    const scheduler = new VirtualTimeScheduler();

    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();
    const fakeOnChange = of(
      [fakeStart, fake1], // should run
      [fake1, fake1], // should run
      [fake1, fake1],
      [fake1, fake1],
      [fake1, fake1],
      [fake1, fake2], // should run
      [fake2, fake2]
    ).pipe(
      concatMap(x => of(x).pipe(delay(100, scheduler))),
      share()
    );

    const fakeOnBlur = of(1, 2, 3).pipe(concatMap(x => of(x).pipe(delay(300, scheduler))));

    const start = scheduler.now();

    instance.manageOnChange$(fakeOnChange, fakeOnBlur).subscribe(
      x => console.log(x),
      () => {},
      () => {
        console.log(JSON.stringify(data, null, 2));
      }
    );

    scheduler.flush();
  });

  test(
    'returns the current state if there is an error, and adds the formLevel errors',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const fakeOnChange = of([{ name: null }, { name, value: 'fake' }]).pipe(share());
      const fakeOnBlur = NEVER;

      const spy = jest.spyOn(instance, 'runFieldLevelValidation').mockImplementation(() => {
        throw new Error('error');
      });

      const setErrSpy = jest.spyOn(instance, 'setFormLevelError');

      return instance.manageOnChange$(fakeOnChange, fakeOnBlur).pipe(
        tap(error => {
          expect(error).toMatchObject(wrapper.state().errors);
          expect(setErrSpy).toHaveBeenCalledTimes(1);
        })
      );
    })
  );

  test(
    'capable of running sync validation',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const fakeOnChange = of([{ name: null }, { name, value: 'fake' }]).pipe(share());
      const fakeOnBlur = NEVER;

      instance.fieldValidators[name] = { validator: syncValidationFunc };

      return instance.manageOnChange$(fakeOnChange, fakeOnBlur).pipe(
        tap(error => {
          expect(error).toMatchObject({ test: fakeErrorObj });
        })
      );
    })
  );

  test(
    'capable of running async validation',
    observe(() => {
      const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
      const instance = wrapper.instance();
      const fakeOnChange = of([{ name: null }, { name, value: 'fake' }]).pipe(share());
      const fakeOnBlur = NEVER;

      instance.fieldValidators[name] = { validator: asyncValidationFunc };

      return instance.manageOnChange$(fakeOnChange, fakeOnBlur).pipe(
        tap(error => {
          expect(error).toMatchObject({ test: fakeErrorObj });
        })
      );
    })
  );
});
