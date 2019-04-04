import { toPath, get } from "lodash";

export default (object: object, name: string): any =>
  get(object, toPath(name), undefined);
