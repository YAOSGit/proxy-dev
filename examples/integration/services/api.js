import http from 'node:http';

const db = {
	users: [
		{ id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin' },
		{ id: 2, name: 'Bob', email: 'bob@example.com', role: 'editor' },
		{ id: 3, name: 'Carol', email: 'carol@example.com', role: 'viewer' },
	],
	products: [
		{ id: 101, name: 'Widget', price: 9.99, stock: 42 },
		{ id: 102, name: 'Gadget', price: 24.99, stock: 7 },
		{ id: 103, name: 'Doohickey', price: 14.50, stock: 0 },
	],
};

const routes = {
	'/users': () => ({ users: db.users, total: db.users.length, page: 1, pageSize: 20 }),
	'/products': () => ({ products: db.products, total: db.products.length }),
	'/health': () => ({ service: 'api', status: 'ok', uptime: process.uptime() }),
};

const server = http.createServer((req, res) => {
	const url = new URL(req.url ?? '/', 'http://localhost:3002');
	console.log(`[api] ${req.method} ${url.pathname}`);

	res.setHeader('Content-Type', 'application/json');

	const handler = routes[url.pathname];
	if (handler) {
		res.writeHead(200);
		res.end(JSON.stringify(handler()));
	} else {
		res.writeHead(404);
		res.end(JSON.stringify({ error: 'Not found', path: url.pathname }));
	}
});

server.listen(3002, () => {
	console.log('[api] Listening on http://localhost:3002');
	console.log('[api] Routes: /users, /products, /health');
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
