import { ElementType } from "react";

export interface IndexSignatureObject {
  [key: string]: any;
}

export const ValidationErrorKey = "validation_function_error_key";

export interface FormHelperState {
  values: object;
  touched: object;
  errors: object;
  isValidating: boolean;
  isSubmitting: boolean;
}

export interface FormHelperContext {
  addField: (name: string, value: any) => void;
  attachFieldValidator: (
    name: string,
    validator: (state: Partial<FormHelperState>) => void,
    multiField: boolean
  ) => void;
  detachFieldValidator: (name: string) => void;
  removeField: (name: string) => void;
  setFormState: (name: string) => (stateChange: StateChange) => void;
  setTouched: (val: boolean, ...names: any[]) => void;
  validateForm: () => void;
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  values: object;
  touched: object;
  errors: object;
  isValidating: boolean;
  isSubmitting: boolean;
  resetForm: () => void;
  triggerFieldChange$: (event: React.ChangeEvent<HTMLInputElement>) => void;
  triggerFieldBlur$: (event: React.FocusEvent<HTMLInputElement>) => void;
  triggerSubmission$: () => void;
}

export interface FormHelperProps {
  initialValues: object;
  onSubmit: (input: null | Partial<FormHelperState>) => void;
  children: (input: object) => React.ReactNode;
  rootValidators: {
    [key: string]: (state: Partial<FormHelperState>) => object;
  };
}

type StateUpdater = (state: FormHelperState) => object;
type StateObj = object;

export type StateChange = StateUpdater | StateObj;

export interface FormFieldHOCProps {
  name: string;
  validateOnChange: boolean;
  validateOnBlur: boolean;
  validator?: (state: object) => object;
  children: ({

  }: {
    field: Field;
    value: any;
    errors: object;
    touched: boolean;
    setFormState: (stateChange: StateChange) => void;
  }) => React.ReactElement;
}

export type ChangeHandler = (
  event: React.ChangeEvent<HTMLInputElement>
) => void;
export type BlurHandler = (event: React.FocusEvent<HTMLInputElement>) => void;

type Field = (
  ...args: any[]
) => {
  onChange: ChangeHandler;
  onBlur: BlurHandler;
  value: any;
  name: string;
};

export interface FieldProps {
  FieldState: {
    value: any;
    errors: object;
    touched: boolean;
  };
  field: Field;
  setFormState: (stateChange: StateChange) => void;
  children: ({

  }: {
    field: Field;
    value: any;
    errors: object;
    touched: boolean;
    setFormState: (stateChange: StateChange) => void;
  }) => React.ReactElement;
}
/*
 onChange: ChangeHandler;
    onBlur: (event: React.FocusEvent<...>) => void;
    value: any;
    name: string;
*/

export interface WithDataProps<T> {
  data: T;
}
