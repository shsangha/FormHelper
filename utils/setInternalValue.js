/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
import { toPath, cloneDeep } from 'lodash';

const shallowSetState = (object, name, value) => {
  if (object[name] === value) {
    return object;
  }
  return { ...object, [`${name}`]: value };
};

export default (rootObject, fieldName, value) => {
  if (rootObject[fieldName]) {
    return shallowSetState(rootObject, fieldName, value);
  }
  // need to do this so we don't actually mutate the state object
  const rootRefference = cloneDeep(rootObject);

  const pathArray = toPath(fieldName);

  // targets the nested value we want to set the state on
  const { target, index } = pathArray.reduce(
    (resVal, currentPath, currentIndex) => {
      if (currentIndex < pathArray.length - 1) {
        if (resVal.target[currentPath]) {
          resVal.target = resVal.target[currentPath];
        } else {
          const nextPath = pathArray[currentIndex + 1];
          resVal.target = resVal.target[currentPath] =
            Number(nextPath) % 1 === 0 && Number(nextPath) >= 0 ? [] : {};
        }
      }
      resVal.index = currentIndex;
      return resVal;
    },
    { target: rootRefference, index: null }
  );

  if (target[pathArray[index]] !== value) {
    target[pathArray[index]] = value;
  }

  return rootRefference;
};
