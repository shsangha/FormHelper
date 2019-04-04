/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
import { toPath, cloneDeep } from "lodash";
import targetInnerVal from "./targetInnerVal";
import { IndexSignatureObject } from "../types";

const shallowSetState = (
  object: IndexSignatureObject,
  name: string,
  value: any
) => {
  if (object[name] === value) {
    return object;
  }
  return { ...object, [`${name}`]: value };
};

/* @input rootObject {Object} the root key of state we want to set value on
   @input fieldName {String} the name of the field 
   @input value {Any} the value we want to set
   @output {Object} the mutated object that we want to pass into setState

   Basically if field is a topLevel field we setState as per usual.
   If there is a nested form value setState wont be enough because it is shallow
   so we deepCopy the state (as not to mutate state) and then mutate the copy and 
   return what we want the new state to look like. 
*/
const set = (
  createFieldFunc: (nextPath: string | number) => object | any[]
) => (rootObject: IndexSignatureObject, fieldNames:, values) => {
  if (rootObject[fieldNames] !== undefined) {
    return shallowSetState(rootObject, fieldNames, values);
  }
  // need to do this so we don't actually mutate the state object
  const rootRefference = cloneDeep(rootObject);

  const pathArray = toPath(fieldNames);

  // targets the nested value we want to set the state on
  const { target, index } = targetInnerVal(
    rootRefference,
    pathArray,
    createFieldFunc
  );

  target[pathArray[index]] = values;

  return rootRefference;
};

const setInternalValue = set(nextPath =>
  Number(nextPath) % 1 === 0 && Number(nextPath) >= 0 ? [] : {}
);
const setInternalError = set(nextPath => ({}));
const setInternalTouched = set(nextPath => ({}));

export default {
  setInternalValue,
  setInternalError,
  setInternalTouched
};
