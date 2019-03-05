/* Heavily inspired by Jared Palmer, and his talk about React forms at 
  React Alicante. Wanted to understand how Formik does field-level/form level validation,,
  and how all of it works with dynamic/nested fields. Took the patterns that make Formik possible
  and reimplemented/tested them using my own logic to further my understanding. Also made some different 
  design decisions including using Observables instead of just promises, having the ability to clear form state when 
  a dynamic form field is removed, and flattening state for touched and error states because there
  wasnt really a good reason for them to be nested. We can assume their keys to be unique because 
  HTML form elements require unique names.

  **STILL WANT TO KNOW** : If there are other patterns that would reduce the number of re-renders
    without having to do deep object comparisons, because this method of dealing with forms is nice for 
    small forms, but becomes extremely unperformant very quickly 
*/
import React, { Component } from 'react';
import propTypes from 'prop-types';
import { merge as deepmerge } from 'lodash';
import { Observable, merge, of, zip } from 'rxjs';
import {
  filter,
  switchMap,
  mergeMap,
  throttleTime,
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
import setInternalValue from './utils/setInternalValue';
import retrieveInternalValue from './utils/retrieveInternalValue';
import removeInternalValue from './utils/removeInternalValue';
import flatSetTouched from './utils/flatSetTouched';
import removeFlatField from './utils/removeFlatField';
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

  constructor(props) {
    super(props);

    const { initialValues: values } = this.props;

    this.state = {
      values,
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
        this.setFormLevelError(error.message);
        return of(this.state.errors);
      })
    );
    // would consider doing a distinctUntilChanged here if the error hasnt't changed to prevent calling setState
    // but think it would probably be faster to re-render than it would do do a deep obj compare every time
  };

  /* Creates an observable that is triggered when a field with validation is blurred
      @returns {Observable} - the error state of the form after validation runs
  */
  createOnBlur$ = () =>
    Observable.create(observer => {
      this.triggerFieldBlur$ = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(share());

  /* Pipeline for validating on blur. Runs validation for the field being blurred and top level form validation and returns the merged result.
     In event where submission is triggered the inner observable will complete bc all validations run on submit so it would be redundant to validate
     twice and setState more than needed.

     @input {Observable} - the stream of field names and values being sent for validation
     @input {Observable} - the submission stream so we know when to interupt
     @return {Observable} - stream of the combined error state from field and form
*/
  manageOnBlur$ = (onBlur$, onSubmit$) =>
    onBlur$.pipe(
      tap(({ name }) => {
        if (!this.state.touched[name]) {
          this.setTouched(name);
        }
      }),
      mergeMap(({ name, value }) =>
        zip(
          zip(this.runFieldLevelValidation(name, value), of(name)),
          this.runFormLevelValidation()
        ).pipe(takeUntil(onSubmit$))
      ),
      map(([[fieldError, name], rootErrors]) => {
        if (fieldError) {
          return deepmerge({ ...this.state.errors, [name]: fieldError }, rootErrors);
        } else {
          const errCopy = { ...this.state.errors };
          delete errCopy[name];
          return deepmerge(errCopy, rootErrors);
        }
      }),
      catchError(error => {
        this.setFormLevelError(error.message);
        return of(this.state.errors);
      })
    );

  /* Creates an observable that is triggered on form submittal
    @returns {Observable} - the stream of submission attempts
*/
  createOnSubmit$ = () =>
    Observable.create(observer => {
      this.triggerSubmission$ = () => {
        observer.next();
      };
    }).pipe(share());

  /* Takes in the submission stream and outputs when the error state is clear so submission can be triggered
     @input {Observable} - the stream of submission attempts
     @returns {Observable} - observable that emits when validations all return no errors
  */
  manageOnSubmit$ = onSubmit$ =>
    onSubmit$.pipe(
      tap(() => this.setState({ isValidating: true })),
      switchMap(() =>
        this.setAllTouched().then(() =>
          zip([this.runAllFieldLevelValidations(), this.runFormLevelValidation()])
        )
      ),
      map(([fieldErrors, formErrors]) => deepmerge(fieldErrors, formErrors)),
      tap(errors =>
        this.setState({
          isValidating: false,
          errors
        })
      ),
      catchError(error => {
        this.setFormLevelError(error.message);
        return of(this.state.errors);
      }),
      filter(validationResults => isEmptyObj(validationResults))
    );

  // \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  // initilizes the subscriptions to the observables
  componentDidMount() {
    const changeValidation$ = this.createOnChange$();
    const blurValidation$ = this.createOnBlur$();
    const submitValidation$ = this.createOnSubmit$();

    this.validationSubscription = merge(
      this.manageOnChange$(changeValidation$, blurValidation$),
      this.manageOnBlur$(blurValidation$, submitValidation$)
    ).subscribe({
      next(errors) {
        this.setState({
          errors
        });
      },
      error() {
        this.setState(prevState => ({
          formErrors: [...prevState.formErrors, 'Unable to validate please try again'].slice(-3)
        }));
      }
    });

    this.submitSubscription = this.manageOnSubmit$(submitValidation$).subscribe({
      next(errors) {
        this.setState(
          {
            errors
          },
          this.handleSubmit
        );
      },
      error() {
        this.setState(prevState => ({
          formErrors: [...prevState.formErrors, 'Unable to validate please try again'].slice(-3)
        }));
      }
    });
  }

  // stops listening to streams to prevent memory leaks
  componentWillUnmount() {
    this.validationSubscription.unsubscribe();
    this.submitSubscription.unsubscribe();
  }

  /* Called when a Field with validation mounts so the root component can validate on
    a field level when it needs to  
   
    @input name {string} - the name of the field to attach validation on
    @input validation {function} - the validation function to run 
    @input validateOnChange {boolean} - flag to dicate if the field validates on changes
    @input validateOnBlur {bool} - flag to dicate if the field validates on blur
    @returns null
*/
  attachFieldValidator = (name, validator, validateOnChange, validateOnBlur) => {
    this.fieldValidators[name] = {
      validator,
      validateOnChange,
      validateOnBlur
    };
  };

  /* Removes field from validators, called when a dynamic field is removed from the form
    @input name {string} - the name of the field to stop validating on
  */
  detachFieldValidator = name => {
    delete this.fieldValidators[name];
  };

  // TRIGGERS FOR THE VALIDATION OBSERVABLES  /////////////////////////////////////////

  /* Runs validation on a specific field. Returns the error if there is one, null if validation succeeds. If
    the validation func throws an error formLevel error state is updated, and the field error is returned as it was before.

    @input name {string} - name of the field to run validation on
    @input value {any} - the value of the field

    @return {promise} - promise that resolves to the error state of given field

  */
  runFieldLevelValidation = (name, value) => {
    return new Promise(resolve => resolve(this.fieldValidators[name].validator(value)))
      .then(result => (isEmptyObj(result) ? null : result))
      .catch(error => {
        this.setState(prevState => ({
          formErrors: [...prevState.formErrors, error.message || 'Unknown Error Occured'].slice(-3)
        }));
        return this.state.errors[name] || null;
      });
  };

  /* Runs all the field level validation and merges the results together
     @returns {promise} - promise that resolves to the combined field level errors
*/
  runAllFieldLevelValidations = () => {
    const validatorKeys = Object.keys(this.fieldValidators);

    const promiseArray = validatorKeys.map(key => {
      return this.runFieldLevelValidation(key, retrieveInternalValue(this.state.values, key));
    });

    return Promise.all(promiseArray).then(filteredErrors =>
      flatCombineFieldValidators(validatorKeys, filteredErrors)
    );
    //   .then(errorsArray => {
    //     console.log(errorsArray);
    //     errorsArray.filter(error => error);
    //   });
  };

  /* Runs the root level validator and returns a promise that resolves to the new root level error state
    @returns {promise} - resolves to root level error state to be combined with the field level errors in the validation streams
  */
  runFormLevelValidation = () => {
    const { validate } = this.props;
    const { values } = this.state;

    return new Promise(res => res(validate(values))).catch(error => {
      this.setState(prevState => ({
        formErrors: [...prevState.formErrors, error.message || 'Unknown Error Occured'].slice(-3)
      }));
      return this.state.errors;
    });
  };

  //\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

  /* Sets a given field to touched 
    @input name {string} - the name of the field that is touched
    @returns null
 */
  setTouched = name => {
    this.setState(prevState => ({
      touched: { ...prevState.touched, [name]: true }
    }));
  };

  setValidating = isValidating => {
    this.setState({
      isValidating
    });
  };

  /* Sets all fields to touched, called when we try to submit.
    @returns {promise} - resolves when touched state has been set to true for all fields with validation
  */
  setAllTouched = () => {
    const validatorKeys = Object.keys(this.fieldValidators);

    return new Promise(resolve => {
      this.setState(
        {
          touched: flatSetTouched(validatorKeys)
        },
        () => {
          resolve();
        }
      );
    });
  };

  /* Sets top level form errors when form validation throw unexpected errors to notify user
     @input error {string} - the error message from the thrown error
  */
  setFormLevelError = error => {
    this.setState({
      formErrors: [...this.state.formErrors, error].slice(-3)
    });
  };

  /* Helper function passed into context and to children to allow custom event handlers 
     @returns null
  */
  setFormState = (state, callback = () => {}) => {
    this.setState(state, callback);
  };

  /* Clears an error when a user acknowledges it 
     @returns null
  */
  removeFormLevelError = index => {
    this.setState(prevState => {
      const temp = [...prevState.formErrors];
      temp.splice(index, 1);
      return temp;
    });
  };

  /* Removes a field  from formState, can be used to remove from an array-field, or when dynamic fields are removed
     removes the field from state so we don't have to clean it up serverside aferwards. 
     @returns null
  */
  removeField = name => {
    this.setState(prevState => ({
      values: removeInternalValue(prevState.values, name),
      errors: prevState.errors[name] ? removeFlatField(prevState.errors, name) : prevState.errors,
      touched: prevState.touched[name]
        ? removeFlatField(prevState.touched, name)
        : prevState.touched
    }));
  };

  /* Resets formState back to its defautls 
     @returns null
  */
  resetForm = () => {
    this.setState({
      values: this.props.initialValues,
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false,
      formErrors: []
    });
  };
  /* Another field to help with dynamic forms, 
     call this when adding a field to an array, or dynamically adding a field,
     so that initial value won't be undefined when the Field mounts
     @returns null
  */
  addField = (name, initialValue) => {
    this.setState({
      values: { ...values, [name]: initialValue }
    });
  };

  /* Default implementation of handle-change can be overridden with the getInputProps helper in Field components,
     sets the state to the value for any field that makes sense for (anything but checkboxes), and checked if not.
     If the field that is changes has validation and validates on change the fieldLevelValidation stream is also triggered
     @input event {object} - the synthetic react event passed into the handler
     @returns null

  */
  handleChange = event => {
    const { name, value, type, checked } = event.currentTarget;

    let newValue = value;

    if (type === 'checkbox') {
      newValue = checked;
    }

    this.setState(
      prevState => ({
        ...prevState,
        values: setInternalValue(prevState.values, name, newValue)
      }),
      () => {
        if (
          checkValidValidatorFunc.call(this, name) &&
          this.fieldValidators[name].validateOnChange
        ) {
          this.triggerFieldChange$(name, newValue);
        }
      }
    );
  };

  /* Default implementation of handle-blur again easily overriden in Field props,
     triggers field validation stream if the given field validates on blur
     @input event {object} - the synthetic react event
     @returns null
  */
  handleBlur = event => {
    const { name, value } = event.currentTarget;
    if (this.fieldValidators[name].validateOnBlur) {
      this.triggerFieldBlur$(name, value);
    }
  };

  /* Calls the submit fucntion from props
     is called if the submission validation stream passes through
     and empty object indicating that no errors exist and submission can proceed
  */
  handleSubmit = () => {
    const { errors, values } = this.state;

    if (!errors) {
      this.props.onSubmit(values);
    }
  };

  // passes current state and helper functions into context and children for max flexibility as to how the component can be used
  getStateAndHelpers = () => {
    const {
      addField,
      attachFieldValidator,
      detachFieldValidator,
      removeFormLevelError,
      runFormLevelValidation,
      runFieldLevelValidation,
      runAllFieldLevelValidations,
      handleBlur,
      handleChange,
      handleSubmit,
      triggerFieldBlur$,
      triggerFieldChange$,
      triggerSubmission$,
      resetForm,
      removeField,
      setAllTouched,
      setTouched,
      setFormState,
      setFormLevelError,
      state
    } = this;

    return {
      addField,
      attachFieldValidator,
      detachFieldValidator,
      removeFormLevelError,
      runFormLevelValidation,
      runFieldLevelValidation,
      runAllFieldLevelValidations,
      handleBlur,
      handleChange,
      handleSubmit,
      triggerFieldBlur$,
      triggerFieldChange$,
      triggerSubmission$,
      resetForm,
      removeField,
      setAllTouched,
      retrieveInternalValue,
      setInternalValue,
      setTouched,
      setFormState,
      setFormLevelError,
      ...state
    };
  };

  render() {
    const { children } = this.props;

    return (
      <FormContext.Provider value={{ ...this.getStateAndHelpers() }}>
        {children({ ...this.getStateAndHelpers() })}
      </FormContext.Provider>
    );
  }
}
