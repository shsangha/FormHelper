/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests that the observable for field level validaition is created as expected', () => {
  const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
  const instance = wrapper.instance();

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

  test('makes sure that observable emits pairwise so we can filter properly', () => {
    const onChange$ = instance.createOnChange$().subscribe(([prev, current]) => {
      expect(prev.name).toBeNull();
      expect(current.name).toEqual('fakeName');
      expect(current.value).toEqual('fakeValue');
    });
    instance.triggerFieldChange$('fakeName', 'fakeValue');
    onChange$.unsubscribe();
  });

  test('makes sure that the observable is multi-cast so we can subscribe to the inner observable twice in merge func later', () => {
    const onChange$ = instance.createOnChange$();

    const sub1 = onChange$.subscribe(([prev, current]) => {
      expect(prev.name).toBeNull();
      expect(current.name).toEqual('fakeName');
      expect(current.value).toEqual('fakeValue');
    });
    const sub2 = onChange$.subscribe(([prev, current]) => {
      expect(prev.name).toBeNull();
      expect(current.name).toEqual('fakeName');
      expect(current.value).toEqual('fakeValue');
    });

    instance.triggerFieldChange$('fakeName', 'fakeValue');

    sub1.unsubscribe();
    sub2.unsubscribe();
  });
});
