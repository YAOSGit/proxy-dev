import chalk, { type ChalkInstance } from 'chalk';
import {
	METHOD_COLORS as TOOLKIT_METHOD_COLORS,
	statusColor,
} from '@yaos-git/toolkit/tui/http';

const COLOR_FNS: Record<string, ChalkInstance> = {
	green: chalk.green,
	yellow: chalk.yellow,
	blue: chalk.blue,
	cyan: chalk.cyan,
	red: chalk.red,
	gray: chalk.gray,
	magenta: chalk.magenta,
	white: chalk.white,
};

const formatMethod = (method: string): string => {
	const colorName = TOOLKIT_METHOD_COLORS[method.toUpperCase()] ?? 'white';
	const colorFn = COLOR_FNS[colorName] ?? ((s: string) => s);
	const padded = method.toUpperCase().padEnd(7);
	return colorFn(padded);
};

const formatStatus = (status: number): string => {
	const colorName = statusColor(status);
	const colorFn = COLOR_FNS[colorName];
	return colorFn ? colorFn(String(status)) : String(status);
};

const formatLatency = (ms: number): string => {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
};

const truncateBody = (body: string, maxBytes: number): string => {
	if (body.length <= maxBytes) return body;
	return `${body.slice(0, maxBytes)}...[truncated]`;
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
