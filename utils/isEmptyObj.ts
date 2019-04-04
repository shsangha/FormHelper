import isObj from "./isObj";

export default (obj: any) =>
  isObj(obj) &&
  Object.keys(obj).reduce((current, next) => {
    if (obj.hasOwnProperty(next)) {
      return false;
    }
    return true;
  }, true);
