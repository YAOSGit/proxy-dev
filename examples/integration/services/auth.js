import http from 'node:http';

const VALID_CREDENTIALS = { email: 'alice@example.com', password: 'password123' };

const server = http.createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', 'http://localhost:3001');
	console.log(`[auth] ${req.method} ${url.pathname}`);

	res.setHeader('Content-Type', 'application/json');

	if (url.pathname === '/login' && req.method === 'POST') {
		const chunks = [];
		for await (const chunk of req) chunks.push(chunk);
		const body = JSON.parse(Buffer.concat(chunks).toString());

		if (body.email === VALID_CREDENTIALS.email && body.password === VALID_CREDENTIALS.password) {
			res.writeHead(200);
			res.end(JSON.stringify({
				token: 'eyJhbGciOiJIUzI1NiJ9.' + Buffer.from(JSON.stringify({ sub: '1', name: 'Alice' })).toString('base64'),
				expiresIn: 3600,
				user: { id: 1, name: 'Alice', role: 'admin' },
			}));
		} else {
			res.writeHead(401);
			res.end(JSON.stringify({ error: 'Invalid credentials', code: 'AUTH_INVALID' }));
		}
		return;
	}

	if (url.pathname === '/health') {
		res.writeHead(200);
		res.end(JSON.stringify({ service: 'auth', status: 'ok' }));
		return;
	}

	res.writeHead(404);
	res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(3001, () => console.log('[auth] Listening on http://localhost:3001'));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
