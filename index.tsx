import React, { Component } from "react";
import { FormHelperProps, FormHelperState, ValidationErrorKey } from "./types";
import { merge as deepmerge } from "lodash";
import { Observable, merge, of, zip } from "rxjs";
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
} from "rxjs/operators";
import set from "./utils/set";
const { setInternalValue, setInternalError, setInternalTouched } = set;
import combineFieldValidationResults from "./utils/combineFieldValidationResults";
import retrieveInternalValue from "./utils/retrieveInternalValue";

export const FormContext = React.createContext({});

export default class FormHelper extends Component<
  FormHelperProps,
  FormHelperState
> {
  public static readonly defaultProps = {
    initialValues: {},
    onSubmit: () => {
      return;
    },
    rootValidators: {}
  };

  private fieldValidators = {};
  private triggerFieldChange$: (name: string, value: any) => void;
  private triggerFieldBlur$: (name: string, value: any) => void;
  private triggerSubmission$: () => void;

  constructor(props) {
    super(props);

    const { initialValues: values } = this.props;

    this.state = {
      values,
      touched: {},
      errors: {},
      isValidating: false,
      isSubmitting: false
    };
  }

  private createOnChange$ = () =>
    Observable.create(observer => {
      this.triggerFieldChange$ = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(
      startWith({ name: null }),
      pairwise(),
      share()
    );

  private createOnBlur$ = () =>
    Observable.create(observer => {
      this.triggerFieldBlur$ = (name, value) => {
        observer.next({ name, value });
      };
    }).pipe(share());

  private createOnSubmit$ = () =>
    Observable.create(observer => {
      this.triggerSubmission$ = () => {
        observer.next();
      };
    }).pipe(share());

  public manageOnChange$ = (onChange$, onBlur$) =>
    merge(
      onChange$.pipe(
        filter(([prev, current]) => prev.name === current.name),
        throttleTime(300),
        switchMap(([_, { name, value }]) =>
          zip(this.runFieldLevelValidation(name, value), of(name)).pipe(
            takeUntil(onBlur$)
          )
        )
      ),
      onChange$.pipe(
        filter(([prev, current]) => prev.name !== current.name),
        mergeMap(([_, { name, value }]) =>
          zip(this.runFieldLevelValidation(name, value), of(name)).pipe(
            takeUntil(onBlur$)
          )
        )
      )
    ).pipe(
      map(([error, name]) => setInternalError(this.state.errors, name, error))
    );

  public manageOnBlur$ = (onBlur$, onSubmit$) =>
    onBlur$.pipe(
      tap(({ name }) => {
        if (retrieveInternalValue(this.state.touched, name)) {
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
          return deepmerge(
            setInternalError(this.state.errors, name, fieldError),
            rootErrors
          );
        } else {
          return deepmerge(
            removeInternalValue(this.state.errors, name),
            rootErrors
          );
        }
      })
    );

  public manageOnSubmit$ = onSubmit$ =>
    onSubmit$.pipe(
      tap(() => this.setState({ isValidating: true })),
      switchMap(() =>
        this.setAllTouched().then(() =>
          zip([
            this.runAllFieldLevelValidations(),
            this.runFormLevelValidation()
          ])
        )
      ),
      map(([fieldErrors, formErrors]) => deepmerge(fieldErrors, formErrors)),
      tap(errors =>
        this.setState({
          isValidating: false,
          errors
        })
      )
    );

  public componentDidMount() {}
  public componentWillUnmount() {}

  public attachFieldValidator = (
    name,
    validator,
    validateOnChange,
    validateOnBlur
  ) => {
    this.fieldValidators[name] = {
      validator,
      validateOnChange,
      validateOnBlur
    };
  };

  public detachFieldValidator = name => {
    delete this.fieldValidators[name];
  };

  public runFieldLevelValidation = (name, value) => {
    return new Promise(resolve =>
      resolve(this.fieldValidators[name].validator(value))
    )
      .then(result => (isEmptyObj(result) ? null : result))
      .catch(error => ({
        [ValidationErrorKey]: error.message || "Error with validation try again"
      }));
  };

  public runAllFieldLevelValidations = () => {
    const validatorKeys = Object.keys(this.fieldValidators);

    const promiseArray = validatorKeys.map(name => {
      return this.runFieldLevelValidation(
        name,
        retrieveInternalValue(this.state.values, name)
      );
    });

    return Promise.all(promiseArray).then(errors =>
      combineFieldValidationResults(validatorKeys, errors)
    );
  };

  public runFormLevelValidation = () => {
    const { rootValidators } = this.props;
    const { values, errors } = this.state;

    const keysArray = Object.keys(rootValidators);

    return Promise.all(
      keysArray.map(key =>
        new Promise(res => res(rootValidators[key](values)))
          .then(result => (isEmptyObj(result) ? null : result))
          .catch(error => ({
            [ValidationErrorKey]: error.message || "Validation failed try again"
          }))
      )
    ).then(errorsArray =>
      combineFieldValidationResults(keysArray, errorsArray)
    );
  };
}
