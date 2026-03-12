import chalk from 'chalk';

const METHOD_COLORS: Record<string, (s: string) => string> = {
    GET: chalk.green,
    POST: chalk.yellow,
    PUT: chalk.blue,
    PATCH: chalk.cyan,
    DELETE: chalk.red,
    HEAD: chalk.gray,
    OPTIONS: chalk.magenta,
};

const formatMethod = (method: string): string => {
    const colorFn = METHOD_COLORS[method.toUpperCase()];
    const padded = method.toUpperCase().padEnd(7);
    return colorFn ? colorFn(padded) : padded;
};

const formatStatus = (status: number): string => {
    if (status >= 200 && status < 300) return chalk.green(String(status));
    if (status >= 300 && status < 400) return chalk.yellow(String(status));
    if (status >= 400 && status < 500) return chalk.red(String(status));
    if (status >= 500) return chalk.magenta(String(status));
    return String(status);
};

const formatLatency = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
};

const truncateBody = (body: string, maxBytes: number): string => {
    if (body.length <= maxBytes) return body;
    return body.slice(0, maxBytes) + '...[truncated]';
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const formatRouteState = (state: 'LIVE' | 'MOCK'): string => {
    return state === 'LIVE' ? chalk.green('LIVE') : chalk.yellow('MOCK');
};

export {
    formatMethod,
    formatStatus,
    formatLatency,
    truncateBody,
    formatBytes,
    formatRouteState,
};
