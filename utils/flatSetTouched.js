/* eslint-disable no-param-reassign */
export default validatorKeys =>
  validatorKeys.reduce((result, currentKey) => {
    result[currentKey] = true;
    return result;
  }, {});
