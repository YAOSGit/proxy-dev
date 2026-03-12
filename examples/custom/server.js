import http from 'node:http';

const users = [
	{ id: 1, name: 'Alice', email: 'alice@example.com' },
	{ id: 2, name: 'Bob', email: 'bob@example.com' },
	{ id: 3, name: 'Carol', email: 'carol@example.com' },
];

const products = [
	{ id: 101, name: 'Widget', price: 9.99 },
	{ id: 102, name: 'Gadget', price: 24.99 },
];

const routes = {
	'/users': () => ({ users, total: users.length }),
	'/products': () => ({ products, total: products.length }),
	'/health': () => ({ status: 'ok', uptime: process.uptime() }),
};

const server = http.createServer((req, res) => {
	const url = new URL(req.url ?? '/', 'http://localhost:3001');
	console.log(`${req.method} ${url.pathname}`);

	const handler = routes[url.pathname];
	res.setHeader('Content-Type', 'application/json');

	if (handler) {
		res.writeHead(200);
		res.end(JSON.stringify(handler()));
	} else {
		res.writeHead(404);
		res.end(JSON.stringify({ error: 'Not found', path: url.pathname }));
	}
});

server.listen(3001, () => {
	console.log('API v1 listening on http://localhost:3001');
	console.log('  Routes: /users, /products, /health');
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
