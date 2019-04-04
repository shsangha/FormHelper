/* eslint-disable no-multi-assign */
/* eslint-disable no-param-reassign */
export default (rootRefference, pathArray, createFieldFunc = () => ({})) =>
  pathArray.reduce(
    (resVal, currentPath, currentIndex) => {
      if (currentIndex < pathArray.length - 1) {
        if (resVal.target[currentPath]) {
          resVal.target = resVal.target[currentPath];
        } else {
          const nextPath = pathArray[currentIndex + 1];
          resVal.target = resVal.target[currentPath] = createFieldFunc(nextPath);
        }
      }
      resVal.index = currentIndex;
      return resVal;
    },
    { target: rootRefference, index: null }
  );
