/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
import { toPath, cloneDeep } from "lodash";
import { IndexSignatureObject } from "../types";
export default (rootObject: object, fieldName: string) => {
  // need to do this so we don't actually mutate the state object

  const copy = cloneDeep(rootObject);

  const fieldArray = toPath(fieldName);

  const { target, index } = fieldArray.reduce(
    (resVal: IndexSignatureObject, nextKey, idx) => {
      if (idx < fieldArray.length - 1) {
        if (resVal.target[nextKey]) {
          resVal.target = resVal.target[nextKey];
        }
      }
      resVal.index = idx;
      return resVal;
    },
    { target: copy, index: null }
  );

  // if the path is an array splice instead of delete
  if (fieldArray[index].match(/^[0-9]+$/) != null && Array.isArray(target)) {
    target.splice(+fieldArray[index], 1);
  } else {
    delete target[fieldArray[index]];
  }

  return copy;
};
