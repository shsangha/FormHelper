import { FormHelperState } from "../types";

export const deleteValue = (values: any[], index: number) => {
  const copy = [...(values || [])];

  copy.splice(index, 1);

  return copy;
};

export const deleteErrorOrTouched = (state: object, index: number) => {
  const copy: { [key: number]: any; [key: string]: any } = { ...state };

  return Object.keys(state).reduce(
    (newState: { [key: number]: any; [key: string]: any }, currentKey) => {
      const keyAsNum = parseInt(currentKey, 10);
      if (keyAsNum) {
        if (keyAsNum >= index) {
          newState[keyAsNum] = copy[keyAsNum + 1];
        } else {
          newState[keyAsNum] = copy[keyAsNum];
        }
      } else {
        newState[currentKey] = copy[currentKey];
      }
      return newState;
    },
    {}
  );
};
