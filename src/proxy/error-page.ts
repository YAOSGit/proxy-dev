import type { IncomingMessage } from 'node:http';
import type { RouteWithMock } from './interceptor.js';

type TargetDownParams = {
	error: Error;
	route: RouteWithMock;
	req: IncomingMessage;
};

type NoRouteParams = {
	req: IncomingMessage;
	availableRoutes: RouteWithMock[];
};

const escapeHtml = (str: string): string =>
	str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

const buildRequestEcho = (req: IncomingMessage): string => {
	const host = req.headers.host ?? 'unknown';
	const method = req.method ?? 'GET';
	const url = req.url ?? '/';

	const headersRows = Object.entries(req.headers)
		.map(([key, value]) => {
			const val = Array.isArray(value) ? value.join(', ') : (value ?? '');
			return `<tr><td>${escapeHtml(key)}</td><td>${escapeHtml(val)}</td></tr>`;
		})
		.join('');

	return `<div class="card">
    <div class="card-title">Request Echo</div>
    <div class="card-body">
      <div class="request-line">
        <span class="method">${escapeHtml(method)}</span>
        <span class="url">${escapeHtml(`https://${host}${url}`)}</span>
      </div>
      <table>${headersRows}</table>
    </div>
  </div>`;
};

const wrapPage = (title: string, body: string): string => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>proxy-dev · ${escapeHtml(title)}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
    background: #0d1117;
    color: #c9d1d9;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }
  .container { max-width: 720px; width: 100%; }
  .header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
  .badge {
    background: #238636; color: #fff; font-size: 0.7rem; font-weight: 600;
    padding: 0.2rem 0.5rem; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .badge.warn { background: #d29922; }
  .badge.error { background: #da3633; }
  .logo { font-size: 0.85rem; font-weight: 600; color: #58a6ff; }
  h1 { font-size: 1.4rem; font-weight: 600; color: #f0f6fc; margin-bottom: 0.5rem; }
  .subtitle {
    font-size: 0.85rem; color: #8b949e; margin-bottom: 2rem; line-height: 1.5;
  }
  .subtitle code {
    background: #161b22; padding: 0.15rem 0.4rem; border-radius: 3px;
    color: #f97583; font-size: 0.8rem;
  }
  .card {
    background: #161b22; border: 1px solid #30363d; border-radius: 6px;
    margin-bottom: 1rem; overflow: hidden;
  }
  .card-title {
    font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
    color: #8b949e; padding: 0.75rem 1rem; border-bottom: 1px solid #30363d; background: #0d1117;
  }
  .card-body { padding: 1rem; }
  .route-grid {
    display: grid; grid-template-columns: auto 1fr; gap: 0.35rem 1rem; font-size: 0.85rem;
  }
  .route-grid dt { color: #8b949e; white-space: nowrap; }
  .route-grid dd { color: #c9d1d9; font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace; }
  .route-grid dd .port { color: #f97583; font-weight: 600; }
  .route-grid dd .group { color: #d2a8ff; }
  .request-line {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace;
    font-size: 0.85rem; padding: 0.6rem 0.8rem; background: #0d1117;
    border-radius: 4px; margin-bottom: 0.75rem; word-break: break-all;
  }
  .request-line .method { color: #7ee787; font-weight: 600; }
  .request-line .url { color: #79c0ff; }
  table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
  table td {
    padding: 0.3rem 0; font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace;
    vertical-align: top; border-bottom: 1px solid #21262d;
  }
  table td:first-child { color: #8b949e; width: 180px; padding-right: 1rem; white-space: nowrap; }
  table td:last-child { color: #c9d1d9; word-break: break-all; }
  table tr:last-child td { border-bottom: none; }
  .hint {
    font-size: 0.8rem; color: #8b949e; margin-top: 1.5rem; padding: 0.75rem 1rem;
    background: #161b22; border-left: 3px solid #58a6ff; border-radius: 0 4px 4px 0; line-height: 1.6;
  }
  .hint strong { color: #58a6ff; }
  .error-msg {
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace;
    font-size: 0.8rem; color: #f97583; padding: 0.5rem 0.8rem; background: #0d1117;
    border-radius: 4px; margin-top: 0.5rem; word-break: break-all;
  }
  .route-list { list-style: none; font-size: 0.85rem; }
  .route-list li {
    padding: 0.4rem 0; border-bottom: 1px solid #21262d;
    font-family: "SF Mono", "Fira Code", "Fira Mono", Menlo, monospace;
  }
  .route-list li:last-child { border-bottom: none; }
  .route-list .domain { color: #79c0ff; }
  .route-list .arrow { color: #484f58; margin: 0 0.4rem; }
  .route-list .target { color: #f97583; }
  .route-list .group-tag {
    color: #d2a8ff; font-size: 0.7rem; margin-left: 0.5rem;
    background: #1c1231; padding: 0.1rem 0.35rem; border-radius: 3px;
  }
  .empty { color: #484f58; font-style: italic; font-size: 0.85rem; }
</style>
</head>
<body>
<div class="container">
${body}
</div>
</body>
</html>`;

const buildErrorPage = ({ error, route, req }: TargetDownParams): string => {
	const isConnectionRefused = error.message.includes('ECONNREFUSED');

	const body = `
  <div class="header">
    <span class="logo">proxy-dev</span>
    <span class="badge">proxy ok</span>
    <span class="badge error">target down</span>
  </div>

  <h1>${isConnectionRefused ? 'Target Not Responding' : 'Upstream Error'}</h1>
  <p class="subtitle">
    ${
			isConnectionRefused
				? `The proxy forwarded this request to <code>localhost:${route.target}</code> but the connection was refused. The target server is likely not running.`
				: `The proxy encountered an error while forwarding to <code>localhost:${route.target}</code>.`
		}
  </p>

  <div class="card">
    <div class="card-title">Routing Rule</div>
    <div class="card-body">
      <dl class="route-grid">
        <dt>Domain</dt>
        <dd>${escapeHtml(route.domain)}</dd>
        <dt>Path</dt>
        <dd>${route.path ? escapeHtml(route.path) : '<span style="color:#484f58">/ (catch-all)</span>'}</dd>
        <dt>Target</dt>
        <dd>localhost:<span class="port">${route.target}</span></dd>${
					route.groupName
						? `
        <dt>Group</dt>
        <dd><span class="group">${escapeHtml(route.groupName)}</span></dd>`
						: ''
				}${
					route.latencyMs
						? `
        <dt>Latency</dt>
        <dd>${route.latencyMs}ms</dd>`
						: ''
				}
      </dl>
    </div>
  </div>

  ${buildRequestEcho(req)}

  <div class="error-msg">${escapeHtml(error.message)}</div>

  <div class="hint">
    <strong>Hint:</strong> Make sure your server is running on port <strong>${route.target}</strong>.
    The proxy itself is working correctly and will forward traffic once the target is available.
  </div>`;

	return wrapPage('Target Not Responding', body);
};

const buildNoRoutePage = ({ req, availableRoutes }: NoRouteParams): string => {
	const host = req.headers.host ?? 'unknown';

	const routeListItems =
		availableRoutes.length > 0
			? availableRoutes
					.map((r) => {
						const pathPart = r.path ? escapeHtml(r.path) : '';
						const groupTag = r.groupName
							? `<span class="group-tag">${escapeHtml(r.groupName)}</span>`
							: '';
						return `<li><span class="domain">${escapeHtml(r.domain)}${pathPart}</span><span class="arrow">-&gt;</span><span class="target">localhost:${r.target}</span>${groupTag}</li>`;
					})
					.join('')
			: '<li class="empty">No routes configured</li>';

	const body = `
  <div class="header">
    <span class="logo">proxy-dev</span>
    <span class="badge">proxy ok</span>
    <span class="badge warn">no route</span>
  </div>

  <h1>No Route Found</h1>
  <p class="subtitle">
    The proxy received a request for <code>${escapeHtml(host)}</code> but no routing rule matches this domain and path.
  </p>

  ${buildRequestEcho(req)}

  <div class="card">
    <div class="card-title">Available Routes</div>
    <div class="card-body">
      <ul class="route-list">${routeListItems}</ul>
    </div>
  </div>

  <div class="hint">
    <strong>Hint:</strong> Add a route for <strong>${escapeHtml(host)}</strong> in your proxy-dev
    configuration, or check that the correct groups are active.
  </div>`;

	return wrapPage('No Route Found', body);
};

export { buildErrorPage, buildNoRoutePage };
export type { TargetDownParams, NoRouteParams };
