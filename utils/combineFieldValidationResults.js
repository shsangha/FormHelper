/* eslint-disable no-param-reassign */
/* eslint-disable no-multi-assign */
import { toPath } from 'lodash';
import isEmptyObj from './isEmptyObj';
import isObj from './isObj';

const isValidIndex = num => Number(num) % 1 === 0 && Number(num) >= 0;

/* @input - {Array} - a 2d array containing an array of field names and the corresponding error object
   @ouput - {Object} a combined error object from all the fields

   uses the fact that Objects are passed by refference in js so we can gain access to the nested
   value of the object we want to change, and changes in the nested object change the parent object 
   accordingly. Ususally this isn't something you want to do becasue it violates immutibility, but in this case
   it's fine becasue we contain the side-effect within the function so we aren't mutating any values
   that exist outide the scope of this function so it is still visibiy pure.
*/
export default errors =>
  errors.reduce((combinedErrors, validatorResult) => {
    const [name, currentError] = validatorResult;
    const pathArray = toPath(name);
    // ignore if there are no errors
    if (
      (isObj(currentError) && !isEmptyObj(currentError)) ||
      isValidIndex(pathArray[pathArray.length - 1])
    ) {
      const { target, index } = pathArray.reduce(
        (resVal, currentPath, currentIndex) => {
          if (currentIndex < pathArray.length - 1) {
            if (resVal.target[currentPath]) {
              resVal.target = resVal.target[currentPath];
            } else {
              const nextPath = pathArray[currentIndex + 1];
              resVal.target = resVal.target[currentPath] = isValidIndex(nextPath) ? [] : {};
            }
          }
          resVal.index = currentIndex;
          return resVal;
        },
        { target: combinedErrors, index: null }
      );
      target[pathArray[index]] = currentError;
    }
    return combinedErrors;
  }, {});
