import React, { Component } from "react";
import {
  FormHelperProps,
  FormHelperState,
  FormHelperContext,
  ValidationErrorKey,
  IndexSignatureObject,
  StateChange
} from "./types";
import { merge as deepmerge } from "lodash";
import { Observable, merge, of, zip, Observer, Subscription } from "rxjs";
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
  takeUntil
} from "rxjs/operators";
import set from "./utils/set";
const { setInternalValue, setInternalError, setInternalTouched } = set;
import isEmptyObj from "./utils/isEmptyObj";
import removeInternalValue from "./utils/removeInternalValue";
import combineFieldValidationResults from "./utils/combineFieldValidationResults";
import retrieveInternalValue from "./utils/retrieveInternalValue";

export const FormContext = React.createContext({} as FormHelperContext);

export default class FormHelper extends Component<
  FormHelperProps,
  FormHelperState
> {
  public static defaultProps = {
    initialValues: {},
    onSubmit: () => {
      return;
    },
    rootValidators: {}
  };

  private fieldValidators: IndexSignatureObject = {};
  private triggerFieldChange$: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void = () => {
    return;
  };
  private triggerFieldBlur$: (
    event: React.FocusEvent<HTMLInputElement>
  ) => void = () => {
    return;
  };
  private triggerSubmission$: () => void = () => {
    return;
  };
  private validationSubscription?: Subscription;
  private submissionSubscription?: Subscription;

  constructor(props: FormHelperProps) {
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

  private createOnChange$ = (): Observable<any> =>
    Observable.create((observer: Observer<any>) => {
      this.triggerFieldChange$ = (
        event: React.ChangeEvent<HTMLInputElement>
      ) => {
        const { name, value } = event.target;
        if (name && value) {
          observer.next({ name, value });
        }
      };
    }).pipe(
      startWith({ name: null }),
      pairwise(),
      share()
    );

  private createOnBlur$ = (): Observable<any> =>
    Observable.create((observer: Observer<any>) => {
      this.triggerFieldBlur$ = (event: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        if (name && value) {
          observer.next({ name, value });
        }
      };
    }).pipe(share());

  private createOnSubmit$ = (): Observable<any> =>
    Observable.create((observer: Observer<any>) => {
      this.triggerSubmission$ = () => {
        observer.next("");
      };
    }).pipe(share());

  public manageOnChange$ = (
    onChange$: Observable<any>,
    onBlur$: Observable<any>
  ) =>
    merge(
      onChange$.pipe(
        filter(
          ([prev, current]: [
            { name: string; value?: object },
            { name: string; value: object }
          ]) => prev.name === current.name
        ),
        throttleTime(300),
        switchMap(([_, { name, value }]) =>
          zip(this.runFieldLevelValidation(name, value), of(name)).pipe(
            takeUntil(onBlur$)
          )
        )
      ),
      onChange$.pipe(
        filter(
          ([prev, current]: [
            { name: string; value?: object },
            { name: string; value: object }
          ]) => prev.name !== current.name
        ),
        mergeMap(([_, { name, value }]) =>
          zip(this.runFieldLevelValidation(name, value), of(name)).pipe(
            takeUntil(onBlur$)
          )
        )
      )
    ).pipe(
      map(([error, name]) => setInternalError(this.state.errors, name, error))
    );

  public manageOnBlur$ = (
    onBlur$: Observable<any>,
    onSubmit$: Observable<any>
  ) =>
    onBlur$.pipe(
      tap(({ name }: { name: string; value: object }) => {
        if (retrieveInternalValue(this.state.touched, name)) {
          this.setTouched(true, name);
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

  public manageOnSubmit$ = (onSubmit$: Observable<any>) =>
    onSubmit$.pipe(
      tap(() => this.setState({ isValidating: true })),
      tap(() => this.setTouched(true, Object.keys(this.fieldValidators))),
      switchMap(() =>
        zip([this.runAllFieldLevelValidations(), this.runFormLevelValidation()])
      ),
      map(([fieldErrors, formErrors]) => deepmerge(fieldErrors, formErrors)),
      tap(errors =>
        this.setState({
          isValidating: false,
          errors
        })
      )
    );

  public componentDidMount() {
    const changeValidation$ = this.createOnChange$();
    const blurValidation$ = this.createOnBlur$();
    const submitValidation$ = this.createOnSubmit$();

    this.validationSubscription = merge(
      this.manageOnChange$(changeValidation$, blurValidation$),
      this.manageOnBlur$(blurValidation$, submitValidation$)
    ).subscribe(validationResults => {
      this.setState({ errors: validationResults });
    });

    this.submissionSubscription = this.manageOnSubmit$(
      submitValidation$
    ).subscribe(errors => {
      if (isEmptyObj(errors)) {
        this.props.onSubmit(this.state.values);
      } else {
        this.setState({ errors });
      }
    });
  }
  public componentWillUnmount() {}

  public attachFieldValidator = (
    name: string,
    validator: (state: Partial<FormHelperState>) => void,
    multiField: boolean
  ) => {
    this.fieldValidators[name] = {
      validator,
      multiField
    };
  };

  public detachFieldValidator = (name: string) => {
    delete this.fieldValidators[name];
  };

  public runFieldLevelValidation = (
    name: string,
    value: Partial<FormHelperState>
  ) => {
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
          .then(result =>
            this.fieldValidators[key].multiField ? { [key]: result } : result
          )
          .catch(error => ({
            [ValidationErrorKey]: error.message || "Validation failed try again"
          }))
      )
    ).then(errorsArray =>
      combineFieldValidationResults(keysArray, errorsArray)
    );
  };

  public handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.currentTarget;

    let newValue: string | boolean = value;

    if (type && type === "checkbox") {
      newValue = checked;
    }

    this.setState(prevState => ({
      ...prevState,
      values: setInternalValue(prevState.values, name, newValue)
    }));
  };

  public handleSubmit = () => {
    if (this.triggerSubmission$) {
      this.triggerSubmission$();
    }
  };

  public resetForm = () => {
    this.setState({
      values: this.props.initialValues,
      errors: {},
      touched: {},
      isValidating: false,
      isSubmitting: false
    });
  };

  public addField = (name: string, value: any) => {
    this.setState(prevState => ({
      values: setInternalValue(prevState.values, name, value)
    }));
  };

  public removeField = (name: string) => {
    this.setState((prevState: FormHelperState) => ({
      values: removeInternalValue(prevState.values, name),
      errors: removeInternalValue(prevState.errors, name),
      touched: removeInternalValue(prevState.touched, name)
    }));
  };

  public setTouched = (val: boolean, ...names: any[]) => {
    this.setState(prevState => ({
      touched: names.reduce(
        (result, currentName) => setInternalTouched(result, currentName, val),
        prevState.touched
      )
    }));
  };

  public validateForm = () => {
    if (this.triggerSubmission$) {
      this.triggerSubmission$();
    }
  };

  public setFormState = (name: string) => (stateChange: StateChange) => {
    const changes: object =
      typeof stateChange === "function"
        ? stateChange(retrieveInternalValue(this.state.values, name))
        : stateChange;

    this.setState(prevState => ({
      values: setInternalValue(prevState.values, name, changes)
    }));
  };

  public getStateAndHelpers = () => {
    const {
      addField,
      attachFieldValidator,
      detachFieldValidator,
      removeField,
      setFormState,
      setTouched,
      validateForm,
      handleChange,
      handleSubmit,
      state,
      resetForm,
      triggerFieldChange$,
      triggerFieldBlur$,
      triggerSubmission$
    } = this;

    return {
      addField,
      attachFieldValidator,
      detachFieldValidator,
      removeField,
      setFormState,
      setTouched,
      validateForm,
      handleChange,
      handleSubmit,
      ...state,
      resetForm,
      triggerFieldChange$,
      triggerFieldBlur$,
      triggerSubmission$
    };
  };
  public render() {
    const { children } = this.props;
    return (
      <FormContext.Provider value={{ ...this.getStateAndHelpers() }}>
        {children(this.getStateAndHelpers())}
      </FormContext.Provider>
    );
  }
}
