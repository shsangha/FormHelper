import { FormHelperState } from "../types";

export const unshiftValues = (values: any[], newValue: any) => {
  const copy = [...(values || [])];

  copy.unshift(newValue);

  return copy;
};

export const unshiftErrorsOrTouched = (state: object): any => {
  const copy: { [key: number]: any; [key: string]: any } = { ...state };

  return Object.keys(copy).reduce(
    (result: { [key: number]: any; [key: string]: any }, key) => {
      const keyAsNum = parseInt(key, 10);
      if (keyAsNum || keyAsNum === 0) {
        if (keyAsNum > 0) {
          result[keyAsNum] = copy[keyAsNum - 1];
        }
      } else {
        result[key] = copy[key];
      }
      return result;
    },
    {}
  );
};
