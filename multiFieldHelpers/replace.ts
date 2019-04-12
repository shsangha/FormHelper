export default (target: any[] | { [key: number]: any }): any => (
  values: any[] | { [key: number]: any },
  index: number,
  newValue: any
): object => {
  const copy = Object.assign(target, values);

  copy[index] = newValue;

  return copy;
};
