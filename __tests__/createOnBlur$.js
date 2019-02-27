/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import { merge } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import FormHelper from '../index';

describe('makes sure the blur validation stream is created as expected', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  test.only('make sure the observable is multicast so we can use it in multiple places', done => {
    const onBlurObservable = instance.createOnBlur$().pipe(take(1));

    const fake$1 = onBlurObservable.pipe(
      tap(({ name, value }) => {
        try {
          expect(name).toEqual('test');
          expect(value).toEqual('test');
        } catch (e) {
          done.fail(e);
        }
      })
    );
    const fake$2 = onBlurObservable.pipe(
      tap(({ name, value }) => {
        try {
          expect(name).toEqual('test');
          expect(value).toEqual('test');
        } catch (e) {
          done.fail(e);
        }
      })
    );

    merge(fake$1, fake$2).subscribe({
      next() {},
      error() {},
      complete() {
        done();
      }
    });
    instance.triggerFieldBlur$('test', 'test');
  });

  test('make sure that the function returns an observable', () => {
    const onBlurObservable = instance.createOnBlur$();
    expect(onBlurObservable).toMatchObject({
      _isScalar: false,
      source: {
        source: {
          _isScalar: false
        }
      },
      operator: {
        connectable: {
          source: {
            _isScalar: false
          }
        }
      }
    });
  });
});
