import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import tls from 'node:tls';
import { parentPort } from 'node:worker_threads';
import type {
	CertPathsForWorker,
	ProxyCommand,
	ProxyEvent,
} from '../types/Ipc/index.js';
import type { LatencyConfig } from '../types/Latency/index.js';
import type { MockVariant } from '../types/Mock/index.js';
import { buildErrorPage, buildNoRoutePage } from './error-page.js';
import type { RouteWithMock } from './interceptor.js';
import { buildTrafficEntry, collectBody, matchRoute } from './interceptor.js';
import { applyLatency, resolveLatency } from './latency.js';

type ServerState = {
	port: number;
	routes: RouteWithMock[];
	latency: LatencyConfig;
	mockOverrides: Map<string, MockVariant | null>;
};

const state: ServerState = {
	port: 443,
	routes: [],
	latency: { globalMs: 0 },
	mockOverrides: new Map(),
};

const emitEvent = (event: ProxyEvent): void => {
	parentPort?.postMessage(event);
};

const getMockVariant = (
	routeKey: string,
	route: RouteWithMock,
): MockVariant | null | undefined => {
	if (state.mockOverrides.has(routeKey)) {
		return state.mockOverrides.get(routeKey);
	}
	if (route.mockRoute?.active) {
		return route.mockRoute.variants[route.mockRoute.active] ?? null;
	}
	return undefined;
};

let httpsServer: https.Server | null = null;
let httpServer: http.Server | null = null;
let proxyAgent: http.Agent | null = null;

const startServer = (certs: CertPathsForWorker): void => {
	const MAX_CONTEXTS = 100;
	const contexts = new Map<string, tls.SecureContext>();

	const getContext = (domain: string): tls.SecureContext | null => {
		if (!domain) return null;
		const cached = contexts.get(domain);
		if (cached) return cached;

		try {
			const keyPath = path.join(certs.leavesDir, `${domain}.key`);
			const certPath = path.join(certs.leavesDir, `${domain}.crt`);

			if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
				// console.log(`[SNI] Loading cert for ${domain}`);
				const ctx = tls.createSecureContext({
					key: fs.readFileSync(keyPath),
					cert: fs.readFileSync(certPath),
					ca: fs.readFileSync(certs.caCert),
				});
				if (contexts.size >= MAX_CONTEXTS) {
					const firstKey = contexts.keys().next().value;
					if (firstKey) contexts.delete(firstKey);
				}
				contexts.set(domain, ctx);
				return ctx;
			}
		} catch (e) {
			console.error(`[SNI] Failed to create context for ${domain}:`, e);
		}
		return null;
	};

	// Try to find a default cert for non-SNI clients or as a fallback
	let defaultKey: Buffer | undefined;
	let defaultCert: Buffer | undefined;
	try {
		const files = fs.readdirSync(certs.leavesDir);
		const firstCert = files.find((f) => f.endsWith('.crt'));
		if (firstCert) {
			const domain = firstCert.replace('.crt', '');
			defaultKey = fs.readFileSync(path.join(certs.leavesDir, `${domain}.key`));
			defaultCert = fs.readFileSync(
				path.join(certs.leavesDir, `${domain}.crt`),
			);
		}
	} catch (_e) {
		// No default cert available
	}

	const sslOptions: https.ServerOptions = {
		key: defaultKey,
		cert: defaultCert,
		minVersion: 'TLSv1.2',
		SNICallback: (servername, cb) => {
			const ctx = getContext(servername);
			if (!ctx) {
				console.warn(
					`[SNI] No certificate matched for "${servername || 'unknown'}"`,
				);
			}
			cb(null, ctx ?? undefined);
		},
	};

	const agent = new http.Agent({ keepAlive: true });
	proxyAgent = agent;

	const requestHandler = (
		req: http.IncomingMessage,
		res: http.ServerResponse,
		isHttps: boolean,
	) => {
		const host = req.headers.host?.split(':')[0] ?? '';
		const urlPath = new URL(
			req.url ?? '/',
			`http${isHttps ? 's' : ''}://${host}`,
		).pathname;
		const startTime = Date.now();

		const route = matchRoute(host, urlPath, state.routes);
		if (!route) {
			const html = buildNoRoutePage({ req, availableRoutes: state.routes });
			res.writeHead(404, {
				'Content-Type': 'text/html; charset=utf-8',
				'Content-Length': Buffer.byteLength(html),
			});
			res.end(html);
			return;
		}

		// Handle HTTP -> HTTPS upgrade
		if (!isHttps && route.httpsUpgrade) {
			const targetUrl = `https://${host}${req.url}`;
			res.writeHead(301, { Location: targetUrl });
			res.end();
			return;
		}

		const routeKey = route.path ? `${route.domain}${route.path}` : route.domain;
		const mockVariant = getMockVariant(routeKey, route);

		if (mockVariant !== undefined && mockVariant !== null) {
			// Serve mock — body collection is fine here since we're not forwarding
			const latencyMs = resolveLatency(
				route.latencyMs,
				state.latency,
				mockVariant.latencyMs,
			);

			let body = '';
			try {
				const fileContent = fs.readFileSync(mockVariant.file, 'utf-8');
				const rawBody = JSON.parse(fileContent);
				if (rawBody && typeof rawBody === 'object' && '_mock' in rawBody) {
					const { _mock: _mockMeta, ...rest } = rawBody;
					body = JSON.stringify(rest);
				} else {
					body = fileContent;
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(`[mock] Failed to read "${mockVariant.file}": ${msg}`);
				res.writeHead(500, { 'Content-Type': 'text/plain' });
				res.end(`Mock file error: ${msg}`);
				return;
			}

			const sendMock = () => {
				if (res.destroyed) return;
				const headers: Record<string, string> = {
					'Content-Type': 'application/json',
					...mockVariant.headers,
				};
				res.writeHead(mockVariant.status, headers);
				res.end(body);
			};

			collectBody(req)
				.then((requestBody) => {
					applyLatency(latencyMs)
						.then(() => {
							sendMock();
							const entry = buildTrafficEntry(
								req,
								mockVariant.status,
								Date.now() - startTime,
								'MOCK',
								requestBody,
								body,
								route.mockRoute?.active,
							);
							emitEvent({ type: 'request', entry });
						})
						.catch((err) => {
							console.error('[mock] Latency/send error:', err);
							if (!res.headersSent) {
								res.writeHead(502, { 'Content-Type': 'text/plain' });
								res.end('Internal mock error');
							}
						});
				})
				.catch((err) => {
					console.error('[mock] Body collection error:', err);
					if (!res.headersSent) {
						res.writeHead(502, { 'Content-Type': 'text/plain' });
						res.end('Internal mock error');
					}
				});
		} else {
			// Proxy to target — pipe request directly, tee body for logging
			const latencyMs = resolveLatency(route.latencyMs, state.latency);

			const forwardHeaders = { ...req.headers };

			const doProxy = () => {
				if (req.destroyed) return;

				const MAX_LOG_BODY = 4096;
				const bodyChunks: Buffer[] = [];
				let loggedBytes = 0;

				req.on('data', (chunk: Buffer) => {
					if (loggedBytes < MAX_LOG_BODY) {
						bodyChunks.push(chunk);
						loggedBytes += chunk.length;
					}
				});

				const forwardPath =
					route.path && req.url?.startsWith(route.path)
						? req.url.slice(route.path.length) || '/'
						: req.url;

				const proxyReq = http.request(
					{
						hostname: 'localhost',
						port: route.target,
						path: forwardPath,
						method: req.method,
						headers: forwardHeaders,
						agent,
					},
					(proxyRes) => {
						res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
						proxyRes.pipe(res);

						res.on('finish', () => {
							const requestBody = Buffer.concat(bodyChunks).toString('utf-8');
							const entry = buildTrafficEntry(
								req,
								res.statusCode,
								Date.now() - startTime,
								'LIVE',
								requestBody,
							);
							emitEvent({ type: 'request', entry });
						});
					},
				);

				proxyReq.on('error', (err) => {
					const requestBody = Buffer.concat(bodyChunks).toString('utf-8');
					if (!res.headersSent) {
						const html = buildErrorPage({ error: err, route, req });
						res.writeHead(502, {
							'Content-Type': 'text/html; charset=utf-8',
							'Content-Length': Buffer.byteLength(html),
						});
						res.end(html);
					}
					const entry = buildTrafficEntry(
						req,
						502,
						Date.now() - startTime,
						'LIVE',
						requestBody,
					);
					emitEvent({ type: 'request', entry });
				});

				req.pipe(proxyReq);
			};

			if (latencyMs > 0) {
				applyLatency(latencyMs)
					.then(doProxy)
					.catch((err) => {
						console.error('[proxy] Latency error:', err);
						if (!res.headersSent) {
							res.writeHead(502, { 'Content-Type': 'text/plain' });
							res.end('Proxy latency error');
						}
					});
			} else {
				doProxy();
			}
		}
	};

	httpsServer = https.createServer(sslOptions, (req, res) =>
		requestHandler(req, res, true),
	);
	httpServer = http.createServer((req, res) => requestHandler(req, res, false));

	httpsServer.listen(state.port, () => {
		emitEvent({ type: 'ready', port: state.port });
	});

	httpServer.listen(80, () => {
		// console.log('HTTP server listening on port 80');
	});

	httpsServer.on('error', (err: NodeJS.ErrnoException) => {
		if (err.code === 'EADDRINUSE') {
			emitEvent({
				type: 'error',
				message: `Port ${state.port} already in use. Stop the conflicting service or use a different port.`,
			});
		} else if (err.code === 'EACCES') {
			emitEvent({
				type: 'error',
				message: `Permission denied for port ${state.port}. Ports below 1024 require root privileges.`,
			});
		} else {
			emitEvent({ type: 'error', message: `HTTPS Error: ${err.message}` });
		}
	});

	httpsServer.on('tlsClientError', (err) => {
		// Log handshake errors to help debug cipher issues
		console.warn(`[TLS] Client error: ${err.message}`);
	});

	httpServer.on('error', (err) => {
		console.error('HTTP Port 80 error:', err.message);
		// We don't fail the whole proxy if port 80 is busy, but we log it
	});
};

parentPort?.on('message', (cmd: ProxyCommand) => {
	switch (cmd.type) {
		case 'start': {
			state.port = cmd.config.port;
			state.routes = cmd.config.routes as RouteWithMock[];
			startServer(cmd.certs as CertPathsForWorker);
			break;
		}
		case 'update-routes': {
			state.routes = cmd.config.routes as RouteWithMock[];
			break;
		}
		case 'update-latency': {
			state.latency = cmd.latency;
			break;
		}
		case 'set-mock': {
			state.mockOverrides.set(cmd.routeKey, cmd.variant);
			break;
		}
		case 'stop': {
			httpsServer?.close();
			httpServer?.close();
			proxyAgent?.destroy();
			setTimeout(() => process.exit(0), 500);
			break;
		}
	}
});
