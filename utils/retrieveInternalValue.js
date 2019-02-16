import { toPath, pick } from 'lodash';

export default (object, name) => pick(object, toPath(name));
