/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
import { toPath, cloneDeep } from 'lodash';

const shallowSetState = (object, name, value) => {
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
export default (rootObject, fieldName, value) => {
  if (rootObject[fieldName] !== undefined) {
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
