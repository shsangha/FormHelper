import React from "react";
import { FieldProps, FormHelperState } from "./types";
import FormFieldHOC from "./FormFieldHOC";
import set from "./utils/set";
import retrieveInternalValue from "./utils/retrieveInternalValue";
import swapHelper from "./multiFieldHelpers/swap";
import pushHelper from "./multiFieldHelpers/push";
import {
  unshiftValues,
  unshiftErrorsOrTouched
} from "./multiFieldHelpers/unshift";
import { deleteValue, deleteErrorOrTouched } from "./multiFieldHelpers/delete";
import replaceHelper from "./multiFieldHelpers/replace";
const { setInternalValue, setInternalError, setInternalTouched } = set;

const MultiField: React.FunctionComponent<FieldProps> = props => {
  const updateArrayField = (
    valueFn: (value: any[]) => any,
    errorFn?: (touched: object) => object,
    touchedFn?: (error: object) => object
  ) => {
    props.setFormState(prevState => ({
      ...prevState,
      values: setInternalValue(
        prevState.values,
        props.name,
        valueFn(retrieveInternalValue(prevState.values, props.name))
      ),
      errors: errorFn
        ? setInternalError(
            prevState.errors,
            props.name,
            errorFn(retrieveInternalValue(prevState.errors, props.name))
          )
        : prevState.errors,
      touched: touchedFn
        ? setInternalTouched(
            prevState.touched,
            props.name,
            touchedFn(retrieveInternalValue(prevState.touched, props.name))
          )
        : prevState.touched
    }));
  };

  const swap = (index1: number, index2: number) => {
    updateArrayField(
      (values: any[]) => swapHelper([])(values, index1, index2),
      (errObj: object) => swapHelper({})(errObj, index1, index2),
      (touchObj: object) => swapHelper({})(touchObj, index1, index2)
    );
  };

  const push = (newValue: any) => {
    updateArrayField((values: any[]) => pushHelper(values, newValue));
  };

  const unshift = (newValue: any) => {
    updateArrayField(
      (values: any[]) => unshiftValues(values, newValue),
      (errObj: object) => unshiftErrorsOrTouched(errObj),
      (touchObj: object) => unshiftErrorsOrTouched(touchObj)
    );
  };

  const deleteField = (index: number) => {
    updateArrayField(
      (values: any[]) => deleteValue(values, index),
      (errObj: object) => deleteErrorOrTouched(errObj, index),
      (touchObj: object) => deleteErrorOrTouched(touchObj, index)
    );
  };

  const replace = (index: number, newValue: any) => {
    updateArrayField(
      (values: any[]) => replaceHelper([])(values, index, newValue),
      (errObj: object) => replaceHelper({})(errObj, index, newValue),
      (touchObj: object) => replaceHelper({})(touchObj, index, newValue)
    );
  };

  const {
    FieldState: { value, errors, touched },
    field
  } = props;

  return props.children({
    field,
    value,
    errors,
    touched,
    swap,
    push,
    unshift,
    deleteField,
    replace
  });
};

export default FormFieldHOC(MultiField, true);
