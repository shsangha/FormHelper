import { IndexSignatureObject } from "../types";

export default (object: object, name: string) => {
  const shallowCopy: IndexSignatureObject = { ...object };

  delete shallowCopy[name];
  return shallowCopy;
};
