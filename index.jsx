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
import { merge as deepmerge } from 'lodash';
import { Observable, merge, of, zip } from 'rxjs';
import {
  distinctUntilChanged,
  filter,
  switchMap,
  mergeMap,
  throttleTime,
  retry,
  tap,
  pairwise,
  startWith,
  map,
  share,
  takeUntil,
  catchError
} from 'rxjs/operators';
import isEmptyObj from './utils/isEmptyObj';
import checkValidValidatorFunc from './utils/checkValidValidatorFunc';
import flatCombineFieldValidators from './utils/flatCombineFieldValidators';

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
      isSubmitting: false,
      formErrors: []
    };
  }

  // FUNCTIONS TO SETUP VALIDATION OBSERVABLES //////////////////////////

  /* @returns -{Observable} 
     creates an observable that is triggered any time a field with validation is set to validate on change
     pairwise is so we can conditionally switch/merge map over the last result so that we call setState less 
     than absolutely neccessary 
  */
  createOnChange$ = () =>
    Observable.create(observer => {
      this.triggerFieldChange$ = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(
      startWith({ name: null }),
      pairwise(),
      share()
    );

  /* @input {Observable} onChange$ - the observable that emits when a field with validation validates on change
     @input {Observable} onBlur$ - observable that is triggered when a validated fields blurs 
     @output {Object} - the merged errors from the field being validated and the current error state
  */
  manageOnChange$ = (onChange$, onBlur$) => {
    return merge(
      onChange$.pipe(
        filter(([prev, current]) => prev.name === current.name),
        throttleTime(300),
        switchMap(([_, { name, value }]) =>
          zip(this.runFieldLevelValidation(name, value), of(name)).pipe(takeUntil(onBlur$))
        )
      ),
      onChange$.pipe(
        filter(([prev, current]) => prev.name !== current.name),
        mergeMap(([_, { name, value }]) =>
          zip(this.runFieldLevelValidation(name, value), of(name)).pipe(takeUntil(onBlur$))
        )
      )
    ).pipe(
      map(([error, name]) => setInternalValue(this.state.errors, name, error)),
      catchError(error => {
        console.log(error);
        this.setFormLevelError(error.message);
        return of(this.state.errors);
      })
    );
    // would consider doing a distinctUntilChanged here if the error hasnt't changed to prevent calling setState
    // but think it would probably be faster to re-render than it would do do a deep obj compare every time
  };

  createOnBlur$ = () =>
    Observable.create(observer => {
      this.triggerFieldBlur$ = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(share());

  mangageOnBlur$ = (onBlur$, onSubmit$) =>
    onBlur$.pipe(
      mergeMap(({ name, value }) =>
        zip(
          zip(this.runFieldLevelValidation(name, value), of(name)),
          this.runFormLevelValidation()
        ).pipe(takeUntil(onSubmit$))
      ),
      map(([[fieldError, name], rootErrors]) =>
        deepmerge({ ...this.state.errors, [name]: fieldError }, rootErrors)
      )
    );

  createOnSubmit$ = () =>
    Observable.create(observer => {
      this.triggerSubmission$ = () => {
        observer.next();
      };
    }).pipe(share());

  manageOnSubmit$ = onSubmit$ =>
    onSubmit$.pipe(
      tap(() => this.setState({ isValidating: true })),
      switchMap(() =>
        Promise.all([this.runAllFielLevelValidations(), this.runFormLevelValidation()])
      ),
      tap(() => this.setState({ isValidating: false }))
    );

  // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  componentDidMount() {
    const changeValidation$ = this.createOnChange$();
    const blurValidation$ = this.createOnBlur$();
    const submitValidation$ = this.createOnSubmit$();

    this.changeStreamSubscription = this.manageOnChange$(
      changeValidation$,
      blurValidation$
    ).subscribe(x => console.log(x));
    this.blurStreamSubscription = this.mangageOnBlur$(blurValidation$, submitValidation$);
    this.submitStreamSubscription = this.manageOnSubmit$(submitValidation$);

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
    return new Promise(resolve => resolve(this.fieldValidators[name].validator(value))).then(
      result => (isEmptyObj(result) ? null : result)
    );
  };

  runAllFielLevelValidations = () => {
    const validatorKeys = Object.keys(this.fieldValidators);

    const promiseArray = validatorKeys.map((key, index) => {
      return this.runFieldLevelValidation(key, retrieveInternalValue(this.state.values, key));
    });

    return Promise.all(promiseArray).then(errorsArray =>
      flatCombineFieldValidators(validatorKeys, errorsArray)
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
  };

  setAllTouched = () => {
    const validatorKeys = Object.keys(this.fieldValidators);

    validatorKeys.map();
  };

  setFormLevelError = error => {
    this.setState({
      formErrors: [...this.state.formErrors, error]
    });
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
          this.triggerFieldChange$(name, value);
        }
      }
    );
  };

  handleBlur = event => {
    const { name, value, type } = event.target;
    console.log('blurred');
    this.triggerFieldBlur$(name, value);
  };

  getStateAndHelpers = () => {};

  render() {
    const { children } = this.props;

    return (
      <FormContext.Provider value={{ a: 3 }}>
        {children({
          handleChange: this.handleChange,
          handleBlur: this.handleBlur,
          attachFieldValidator: this.attachFieldValidator
        })}
      </FormContext.Provider>
    );
  }
}
