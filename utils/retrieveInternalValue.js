import { toPath, get } from 'lodash';

export default (object, name) => get(object, toPath(name), undefined);
