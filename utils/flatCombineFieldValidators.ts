/* eslint-disable no-param-reassign */
import isEmptyObj from "./isEmptyObj";
import isObj from "./isObj";
import { IndexSignatureObject } from "../types";

export default (validatorKeys: string[], errors: object[]) =>
  errors.reduce((result: IndexSignatureObject, currentError, index) => {
    if (isObj(currentError) && !isEmptyObj(currentError)) {
      result[validatorKeys[index]] = currentError;
    }

    return result;
  }, {});
