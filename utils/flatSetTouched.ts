import { IndexSignatureObject } from "../types";

export default (validatorKeys: string[]) =>
  validatorKeys.reduce((result: IndexSignatureObject, currentKey) => {
    result[currentKey] = true;
    return result;
  }, {});
