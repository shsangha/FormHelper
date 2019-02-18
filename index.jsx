/* Heavily inspired by Jared Palmer, and his talk about React forms at 
  React Alicante. Wanted to understand how Formik does field-level/form level validation,,
  and how all of it works with dynamic/nested fields. Borrowed Jared's logic on how he attaches field validators, and 
  took some inspiration from how he deals with nested form state. Other than that all the logic is mine, and 
  I added some functionality (like composable event handlers, and the ability to clean up form state when dymamic fields are exited),
  and took a different approach to handling complex async tasks by electing to use Rx, as just promises worked but was a little clunky for 
  my liking

  **STILL WANT TO KNOW** : If there are other patterns that would reduce the number of re-renders
    without having to do deep object comparisons, because this method of dealing with forms is nice for 
    small forms, but becomes extremely unperformant very quickly 
*/
import React, { Component } from 'react';
import propTypes from 'prop-types';
//import { setInternalValue, makeCancelable } from './utils';
import setInternalValue from './utils/setInternalValue';
import { Observable, merge } from 'rxjs';
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

const FormContext = React.createContext();

export default class FormHelper extends Component {
  static propTypes = {
    initialValues: propTypes.object.isRequired,
    onSubmit: propTypes.func.isRequired,
    validateOnChange: propTypes.bool.isRequired,
    validateOnBlur: propTypes.bool.isRequired,
    rootValidation: propTypes.func.isRequired
  };

  static defaultProps = {
    initialValues: {},
    onSubmit: () => {},
    validateOnChange: true,
    validateOnBlur: true,
    rootValidation: () => {}
  };

  fieldValidators = {};
  roorValiadatorActive = false;
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
      switchMap(({ name, value }) => {
        return this.runFieldLevelValidation(name, value);
      })
    );

    const validationNotActive$ = validation$.pipe(
      filter(({ name }) => this.fieldValidators[name].active !== true),
      mergeMap(({ name, value }) => {
        return this.runFieldLevelValidation(name, value);
      })
    );

    const composed$ = merge(validationActive$, validationNotActive$).pipe(
      tap(x => console.log('DFDSF', x)),
      retry(3)
    );

    this.validationSubscription = composed$.subscribe(x => console.log(x), a => console.log(a));
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

  validateSingleField = name => {
    if (this.fieldValidators[name].cancel) {
      this.fieldValidators[name].cancel;
    }
  };

  handleChange = event => {
    const { name, value, type } = event.target;
    //   console.log(name, type, value);
    /*
    this.setState(prevState => ({
      ...prevState,
      values: setInternalValue(prevState.values, name, value)
    }));
    */
    this.triggerFieldLevelValidation(name, value);
  };

  getStateAndHelpers = () => {};

  render() {
    const { children } = this.props;

    return children({
      handleChange: this.handleChange,
      attachFieldValidator: this.attachFieldValidator
    });
  }
}
