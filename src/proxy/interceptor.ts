import crypto from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { MockRoute } from '../types/Mock/index.js';
import type { Route } from '../types/Route/index.js';
import type { TrafficEntry } from '../types/Traffic/index.js';

type RouteWithMock = Route & { mockRoute?: MockRoute; groupName?: string };

const matchRoute = (
	domain: string,
	urlPath: string,
	routes: RouteWithMock[],
): RouteWithMock | null => {
	let bestMatch: RouteWithMock | null = null;
	let bestPathLength = -1;

	for (const route of routes) {
		if (route.domain !== domain) continue;

		if (!route.path) {
			// Catch-all for this domain
			if (bestPathLength < 0) {
				bestMatch = route;
				bestPathLength = 0;
			}
		} else if (urlPath.startsWith(route.path)) {
			if (route.path.length > bestPathLength) {
				bestMatch = route;
				bestPathLength = route.path.length;
			}
		}
	}

	return bestMatch;
};

const buildTrafficEntry = (
	req: IncomingMessage,
	status: number,
	latencyMs: number,
	routeState: 'LIVE' | 'MOCK',
	requestBody?: string,
	responseBody?: string,
	mockVariant?: string,
): TrafficEntry => {
	const MAX_BODY_BYTES = 4096;
	const url = new URL(
		req.url ?? '/',
		`https://${req.headers.host ?? 'unknown'}`,
	);

	const requestHeaders: Record<string, string> = {};
	for (const [key, value] of Object.entries(req.headers)) {
		if (typeof value === 'string') requestHeaders[key] = value;
		else if (Array.isArray(value)) requestHeaders[key] = value.join(', ');
	}

	const truncatedRequestBody =
		requestBody && requestBody.length > MAX_BODY_BYTES
			? `${requestBody.slice(0, MAX_BODY_BYTES)}...[truncated]`
			: requestBody;

	const truncatedResponseBody =
		responseBody && responseBody.length > MAX_BODY_BYTES
			? `${responseBody.slice(0, MAX_BODY_BYTES)}...[truncated]`
			: responseBody;

	return {
		id: crypto.randomUUID(),
		timestamp: Date.now(),
		method: req.method ?? 'GET',
		domain: req.headers.host?.split(':')[0] ?? 'unknown',
		path: url.pathname,
		status,
		latencyMs,
		routeState,
		requestHeaders,
		requestBody: truncatedRequestBody,
		responseHeaders: {},
		responseBody: truncatedResponseBody,
		mockVariant,
	};
};

const collectBody = (req: IncomingMessage): Promise<string> => {
	return new Promise((resolve) => {
		const chunks: Buffer[] = [];
		req.on('data', (chunk: Buffer) => chunks.push(chunk));
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
		req.on('error', () => resolve(''));
	});
};

export type { RouteWithMock };
export { buildTrafficEntry, collectBody, matchRoute };
