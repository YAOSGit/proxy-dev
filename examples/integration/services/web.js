import http from 'node:http';

const html = `<!DOCTYPE html>
<html>
<head><title>App Dashboard</title></head>
<body>
	<h1>App Dashboard</h1>
	<p>Frontend dev server running on port 3003.</p>
	<p>In production this would be your React/Vue/Svelte app.</p>
	<script>
		fetch('https://api.local/users')
			.then(r => r.json())
			.then(data => console.log('Users:', data));
	</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
	const url = new URL(req.url ?? '/', 'http://localhost:3003');
	console.log(`[web] ${req.method} ${url.pathname}`);

	if (url.pathname === '/health') {
		res.setHeader('Content-Type', 'application/json');
		res.writeHead(200);
		res.end(JSON.stringify({ service: 'web', status: 'ok' }));
		return;
	}

	res.setHeader('Content-Type', 'text/html');
	res.writeHead(200);
	res.end(html);
});

server.listen(3003, () => console.log('[web] Listening on http://localhost:3003'));
process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
