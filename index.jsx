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
import { toPath, merge as deepmerge } from 'lodash';
import { Observable, merge, of, zip, pipe, iif } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  switchMap,
  mergeMap,
  throttleTime,
  retry,
  tap,
  catchError,
  pairwise,
  startWith,
  mergeAll,
  map,
  delay,
  flatMap,
  partition
} from 'rxjs/operators';
import isObj from './utils/isObj';
import isEmptyObj from './utils/isEmptyObj';
import checkValidValidatorFunc from './utils/checkValidValidatorFunc';
import combineFielValidationResults from './utils/combineFieldValidationResults';

export const FormContext = React.createContext();

export default class FormHelper extends Component {
  static propTypes = {
    initialValues: propTypes.object.isRequired,
    onSubmit: propTypes.func.isRequired,
    validate: propTypes.func.isRequired
  };

  static defaultProps = {
    initialValues: {},
    onSubmit: () => {},
    validate: () => {}
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

  // FUNCTIONS TO SETUP VALIDATION OBSERVABLES

  initilizeFieldLevelValidation$ = () => {
    /*
    const validation$ = Observable.create(observer => {
      this.triggerFieldLevelValidation = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(
      startWith({ name: null }),
      pairwise(),
      switchMap(([prev, current]) =>
        iif(() => prev.name === current.name, of(current).pipe(mergeMap(x => of('3'))), of('false'))
      )
    );
*/
    const a$ = Observable.create(observer => {
      this.triggerFieldLevelValidation = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(
      startWith({ name: null }),
      pairwise()
    );

    const [a, b] = a$.pipe(partition(([prev, current]) => prev.name === current.name));

    return merge(a.pipe(tap(() => console.log('a'))), b.pipe(tap(() => console.log('b'))));

    const validationActive$ = validation$.pipe(
      throttleTime(300),
      switchMap(({ name, value }) => zip(this.runFieldLevelValidation(name, value), of(name)))
    );

    const validationNotActive$ = validation$.pipe(
      tap(x => console.log('runs b')),
      filter(([prev, current]) => prev.name !== current.name),
      tap(x => console.log('mergenao')),
      map(([prev, current]) => current),
      mergeMap(({ name, value }) => zip(this.runFieldLevelValidation(name, value), of(name)))
    );

    return merge(validationNotActive$, validationActive$).pipe(catchError(x => console.log(x)));
  };

  // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  componentDidMount() {
    this.mounted = true;

    const composed$ = this.initilizeFieldLevelValidation$();

    this.valdattionSubscription = composed$.subscribe(x => console.log(x), x => console.log(x));

    //possible move this logic out of cdm
    /*
    this.validationSubscription = composed$.subscribe(
      ([errors, name]) => {
        this.setState(prevState => ({
          ...prevState,
          errors: setInternalValue(prevState.errors, name, errors)
        }));
      },
      a => console.log(a)
    );
    */
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

  // TRIGGERS FOR THE VALIDATION OBSERVABLES  /////////////////////////////////////////

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

    return Promise.all(promiseArray).then(errorsArray =>
      combineFielValidationResults(validatorKeys, errorsArray)
    );
  };

  runFormLevelValidation = () => {
    const { validate } = this.props;
    const { values } = this.state;

    return new Promise(res => res(validate(values)));
  };

  runAllValidators = () => {
    return Promise.all([this.runAllFielLevelValidations(), this.runFormLevelValidation()]);
  };

  //\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  setTouched = event => {
    const { name, value } = event.target;

    this.setState(
      prevState => ({
        ...prevState,
        touched: setInternalValue(prevState.touched, name, true)
      }),
      () => {
        if (checkValidValidatorFunc.call(this, name)) {
          Promise.all([
            this.runFieldLevelValidation(name, value),
            this.runFormLevelValidation()
          ]).then(([fieldError, formErrors]) =>
            this.setState(prevState => ({
              ...prevState,
              errors: deepmerge(setInternalValue(prevState.errors, name, fieldError), formErrors)
            }))
          );
        }
      }
    );
  };

  handleChange = event => {
    const { name, value, type } = event.target;
    //  console.log(name, type, value);
    this.setState(
      prevState => ({
        ...prevState,
        values: setInternalValue(prevState.values, name, value)
      }),
      () => {
        if (checkValidValidatorFunc.call(this, name)) {
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
          handleChange: this.handleChange,
          attachFieldValidator: this.attachFieldValidator
        })}
      </FormContext.Provider>
    );
  }
}
