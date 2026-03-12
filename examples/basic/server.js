import http from 'node:http';

const server = http.createServer((req, res) => {
	const url = new URL(req.url ?? '/', `http://localhost:3001`);
	console.log(`${req.method} ${url.pathname}`);

	res.setHeader('Content-Type', 'application/json');
	res.writeHead(200);
	res.end(
		JSON.stringify({
			message: 'Hello from api.local',
			path: url.pathname,
			timestamp: new Date().toISOString(),
		}),
	);
});

server.listen(3001, () => {
	console.log('Backend listening on http://localhost:3001');
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
