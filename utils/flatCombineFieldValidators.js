/* eslint-disable no-param-reassign */
import isEmptyObj from './isEmptyObj';
import isObj from './isObj';

export default (validatorKeys, errors) =>
  errors.reduce((result, currentError, index) => {
    if (isObj(currentError) && !isEmptyObj(currentError)) {
      result[validatorKeys[index]] = currentError;
    }

    return result;
  }, {});
