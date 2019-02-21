/* Heavily inspired by Jared Palmer, and his talk about React forms at 
  React Alicante. Wanted to understand how Formik does field-level/form level validation,,
  and how all of it works with dynamic/nested fields. Took the patterns that make Formik possible
  and reimplemented them/tested them using my own logic to further my understanding. Also made some different 
  design decisions including using Observables instead of just promises, having the ability to clear form state when 
  a dynamic form field is removed, and adding greater flexibility to the event handlers by adding the ability to run
  more than one function when an event is triggered. 

  **STILL WANT TO KNOW** : If there are other patterns that would reduce the number of re-renders
    without having to do deep object comparisons, because this method of dealing with forms is nice for 
    small forms, but becomes extremely unperformant very quickly 
*/
import React, { Component } from 'react';
import propTypes from 'prop-types';
import setInternalValue from './utils/setInternalValue';
import retrieveInternalValue from './utils/retrieveInternalValue';
import { toPath } from 'lodash';
import isObj from './utils/isObj';
import isEmptyObj from './utils/isEmptyObj';
import checkValidValidatorFunc from './utils/checkValidValidatorFunc';
import combineFielValidationResults from './utils/combineFieldValidationResults';
import { Observable, merge, of, zip, pipe } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  switchMap,
  mergeMap,
  throttleTime,
  retry,
  tap,
  catchError
} from 'rxjs/operators';

export const FormContext = React.createContext();

export default class FormHelper extends Component {
  static propTypes = {
    initialValues: propTypes.object.isRequired,
    onSubmit: propTypes.func.isRequired,
    validateOnChange: propTypes.bool.isRequired,
    validateOnBlur: propTypes.bool.isRequired,
    rootValidatior: propTypes.func.isRequired
  };

  static defaultProps = {
    initialValues: {},
    onSubmit: () => {},
    validateOnChange: true,
    validateOnBlur: true,
    rootValidatior: () => {}
  };

  fieldValidators = {};
  mounted = false;

  constructor(props) {
    super(props);

    const { initialValues: values } = this.props;

    this.state = {
      values: {
        free: ''
      },
      touched: {},
      errors: {},
      isValidating: false,
      isSubmitting: false
    };
  }

  runFieldLevelValidation = (name, value) => {
    this.fieldValidators[name].active = true;
    return new Promise(resolve => resolve(this.fieldValidators[name].validator(value))).then(
      errors => {
        this.fieldValidators[name].active = false;
        return errors;
      }
    );
  };

  runAllFielLevelValidations = () => {
    const validatorKeys = Object.keys(this.fieldValidators);

    const promiseArray = validatorKeys.map((key, index) => {
      return this.runFieldLevelValidation(key, retrieveInternalValue(this.state.values, key));
    });

    Promise.all(promiseArray)
      .then(errorsArray => combineFielValidationResults(validatorKeys, errorsArray))
      .then(c => console.log(c));
  };

  componentDidMount() {
    this.mounted = true;

    //possible move this logic out of cdm
    const validation$ = Observable.create(observer => {
      this.triggerFieldLevelValidation = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(
      distinctUntilChanged(
        (previous, current) => previous.name === current.name && previous.value === current.value
      )
    );

    const validationActive$ = validation$.pipe(
      filter(({ name }) => this.fieldValidators[name].active === true),
      throttleTime(300),
      switchMap(({ name, value }) => zip(this.runFieldLevelValidation(name, value), of(name)))
    );

    const validationNotActive$ = validation$.pipe(
      filter(({ name }) => this.fieldValidators[name].active !== true),
      mergeMap(({ name, value }) => zip(this.runFieldLevelValidation(name, value), of(name))),
      filter(([value, name]) => this.fieldValidators[name].active !== true)
    );

    const composed$ = merge(validationActive$, validationNotActive$);

    this.validationSubscription = composed$.subscribe(
      ([errors, name]) => {
        this.setState(prevState => ({
          ...prevState,
          errors: setInternalValue(prevState.errors, name, errors)
        }));
      },
      a => console.log(a)
    );
  }

  componentWillUnmount() {
    this.mounted = false;
    this.validationSubscription.unsubscribe();
    //cancel validation here too
  }

  attachFieldValidator = (name, validationFunc) => {
    this.fieldValidators[name] = { validator: validationFunc, active: false };
  };

  detachFieldValidator = name => {
    delete this.fieldValidators[name];
  };

  setTouched = event => {
    const { name } = event.target;

    this.setState(
      prevState => ({
        ...prevState,
        touched: setInternalValue(prevState.touched, name, true)
      }),
      () => {
        if (checkValidValidatorFunc.call(this, name) && this.props.validateOnBlur) {
          this.triggerFieldLevelValidation(name, value);
        }
      }
    );
  };

  handleChange = event => {
    const { name, value, type } = event.target;
    console.log(name, type, value);
    this.setState(
      prevState => ({
        ...prevState,
        values: setInternalValue(prevState.values, name, value)
      }),
      () => {
        if (checkValidValidatorFunc.call(this, name) && this.props.validateOnChange) {
          this.triggerFieldLevelValidation(name, value);
        }
      }
    );
  };

  getStateAndHelpers = () => {};

  render() {
    const { children } = this.props;

    return (
      <FormContext.Provider value={{ a: 3 }}>
        {children({
          handleChange: this.runAllFielLevelValidations,
          attachFieldValidator: this.attachFieldValidator
        })}
      </FormContext.Provider>
    );
  }
}
