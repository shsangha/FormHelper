/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
import { toPath, cloneDeep } from 'lodash';

export default (rootObject, fieldName) => {
  // need to do this so we don't actually mutate the state object

  const copy = cloneDeep(rootObject);

  const fieldArray = toPath(fieldName);

  const { target, index } = fieldArray.reduce(
    (resVal, nextKey, idx) => {
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

  //

  // if the path is an array splice instead of delete
  if (fieldArray[index].match(/^[0-9]+$/) != null && Array.isArray(target)) {
    console.log(target[fieldArray[index]]);
  } else {
    delete target[fieldArray[index]];
  }

  return copy;
};
