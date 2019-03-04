/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import { merge } from 'rxjs';
import { take } from 'rxjs/operators';
import FormHelper from '../index';

describe('tests that the observable for field level validaition is created as expected', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('make sure that the function returns an observable', () => {
    const onChangeObservable = instance.createOnChange$();

    expect(onChangeObservable).toMatchObject({
      _isScalar: false,
      source: {
        source: {
          _isScalar: false,
          source: {
            _isScalar: false,
            source: {
              _isScalar: false
            },
            operator: {
              concurrent: 1
            }
          },
          operator: {}
        }
      },
      operator: {
        connectable: {
          source: {
            _isScalar: false,
            source: {
              _isScalar: false,
              source: {
                _isScalar: false
              },
              operator: {
                concurrent: 1
              }
            },
            operator: {}
          }
        }
      }
    });
  });

  test('makes sure that observable emits pairwise so we can filter properly', done => {
    instance
      .createOnChange$()
      .pipe(take(1))
      .subscribe({
        next([prev, current]) {
          try {
            expect(prev.name).toBeNull();
            expect(current.name).toEqual('fakeName');
            expect(current.value).toEqual('fakeValue');
          } catch (error) {
            done.fail(error);
          }
        },
        complete() {
          done();
        }
      });
    instance.triggerFieldChange$('fakeName', 'fakeValue');
  });

  test('makes sure that the observable is multi-cast so we can subscribe to the inner observable twice in merge func later', done => {
    const onChange$ = instance.createOnChange$().pipe(take(1));

    const sub1 = onChange$;
    const sub2 = onChange$;

    const nextCalledSpy = jest.fn();

    merge(sub1, sub2).subscribe({
      next([prev, current]) {
        try {
          expect(prev.name).toBeNull();
          nextCalledSpy(current);
        } catch (error) {
          done.fail(error);
        }
      },
      complete() {
        try {
          expect(nextCalledSpy).toHaveBeenCalledTimes(2);
          expect(nextCalledSpy).toHaveBeenNthCalledWith(1, {
            name: 'fakeName',
            value: 'fakeValue'
          });
          expect(nextCalledSpy).toHaveBeenNthCalledWith(2, {
            name: 'fakeName',
            value: 'fakeValue'
          });
          done();
        } catch (error) {
          done.fail(error);
        }
      }
    });

    instance.triggerFieldChange$('fakeName', 'fakeValue');
  });
});
