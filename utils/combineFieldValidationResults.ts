/* eslint-disable no-param-reassign */

/* eslint-disable no-multi-assign */
import { toPath } from 'lodash';
import targetInnerVal from './targetInnerVal';

//const isValidIndex = num => Number(num) % 1 === 0 && Number(num) >= 0;

/* @input - {Array} - a 2d array containing an array of field names and the corresponding error object
   @ouput - {Object} a combined error object from all the fields

   uses the fact that Objects are passed by refference in js so we can gain access to the nested
   value of the object we want to change, and changes in the nested object change the parent object 
   accordingly. Ususally this isn't something you want to do becasue it violates immutibility, but in this case
   it's fine becasue we contain the side-effect within the function so we aren't mutating any values
   that exist outide the scope of this function so it is still visibiy pure. 


  ***DECIDED TO NOT USE THIS AND FLATTEN ERROR STATE BC IT MADE MORE SENSE JUST LEAVING THIS HERE AS DEMONSTRATION

*/

export default (validatorKeys, errors) =>
  errors.reduce((combinedErrors, currentError, idx) => {
    if (currentError) {
      const name = validatorKeys[idx];
      const pathArray = toPath(name);

      const { target, index } = targetInnerVal(combinedErrors, pathArray);

      target[pathArray[index]] = currentError;
    }
    return combinedErrors;
  }, {});
