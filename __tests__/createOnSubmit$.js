/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import { merge } from 'rxjs';
import { take } from 'rxjs/operators';
import FormHelper from '../';

describe('makes sure submission validation stream is created correctly', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

  test('make sure the observable is multicast so we can use it in multiple places', done => {
    const onBlurObservable = instance.createOnSubmit$().pipe(take(1));

    const fake$1 = onBlurObservable;
    const fake$2 = onBlurObservable;

    const nextCalled = jest.fn();

    merge(fake$1, fake$2).subscribe({
      next() {
        nextCalled();
      },
      error() {},
      complete() {
        try {
          expect(nextCalled).toHaveBeenCalledTimes(2);
          done();
        } catch (e) {
          done.fail(e);
        }
      }
    });
    instance.triggerSubmission$();
  });
});
