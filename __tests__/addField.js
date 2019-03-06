/* eslint-disable react/jsx-filename-extension */
/* eslint-disable no-undef */
import React from 'react';
import { shallow } from 'enzyme';
import FormHelper from '../index';

describe('tests to makes sure new fields are added as expected', () => {
  test('can add a new field to an array', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    wrapper.setState(
      {
        values: {
          array: [1]
        }
      },
      () => {
        instance.addField('array[1]', 4);
        wrapper.update();
        expect(wrapper.state('values').array).toEqual(expect.arrayContaining([1, 4]));
      }
    );
  });
  test('adds a new key to the values object as expected', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    expect(wrapper.state('values')).toEqual({});

    instance.addField('newField', 'newValue');
    wrapper.update();
    expect(wrapper.state('values')).toMatchObject({ newField: 'newValue' });
  });

  test('can add keys to nested form values as expected', () => {
    const wrapper = shallow(<FormHelper>{() => {}}</FormHelper>);
    const instance = wrapper.instance();

    wrapper.setState(
      {
        values: {
          firstLevel: {
            nestedObj: {
              here: 'already'
            },
            nestedArray: [1, 2, 3]
          }
        }
      },
      () => {
        instance.addField('firstLevel.nestedObj.newKey', 'newValue');
        instance.addField('firstLevel.nestedArray[3]', 4);
        wrapper.update();
        expect(wrapper.state('values').firstLevel.nestedObj.newKey).toEqual('newValue');
        expect(wrapper.state('values').firstLevel.nestedArray[3]).toEqual(4);
      }
    );
  });
});
