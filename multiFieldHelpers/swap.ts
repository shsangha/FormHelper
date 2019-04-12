export default (target: any[] | { [key: number]: any }) => (
  values: any[] | { [key: number]: any },
  indexA: number,
  indexB: number
): object => {
  const copy = Object.assign(target, values);

  const placeHolder = copy[indexA];
  copy[indexA] = copy[indexB];
  copy[indexB] = placeHolder;

  return copy;
};
