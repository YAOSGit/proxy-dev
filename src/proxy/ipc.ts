import type { ProxyCommand, ProxyEvent } from '../types/Ipc/index.js';

const serializeCommand = (cmd: ProxyCommand): string => {
	return `${JSON.stringify(cmd)}\n`;
};

const parseEvent = (line: string): ProxyEvent | null => {
	try {
		return JSON.parse(line) as ProxyEvent;
	} catch {
		return null;
	}
};

const isProxyReady = (
	event: ProxyEvent,
): event is Extract<ProxyEvent, { type: 'ready' }> => {
	return event.type === 'ready';
};

const isProxyRequest = (
	event: ProxyEvent,
): event is Extract<ProxyEvent, { type: 'request' }> => {
	return event.type === 'request';
};

const isProxyError = (
	event: ProxyEvent,
): event is Extract<ProxyEvent, { type: 'error' }> => {
	return event.type === 'error';
};

export {
	isProxyError,
	isProxyReady,
	isProxyRequest,
	parseEvent,
	serializeCommand,
};
