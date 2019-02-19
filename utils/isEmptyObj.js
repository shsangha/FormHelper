export default function(obj) {
  return Object.keys(obj).reduce((current, next) => {
    if (obj.hasOwnProperty(next)) {
      return false;
    }
    return true;
  }, true);
}
