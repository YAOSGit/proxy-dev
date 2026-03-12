import type { Color } from './index.js';

const METHOD_COLORS: Record<string, Color> = {
    GET: 'green',
    POST: 'yellow',
    PUT: 'blue',
    PATCH: 'cyan',
    DELETE: 'red',
    HEAD: 'gray',
    OPTIONS: 'magenta',
};

export { METHOD_COLORS };
