import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const CLI = path.resolve(import.meta.dirname, '../dist/cli.js');

const run = (args: string[], env?: Record<string, string>) =>
	execFileSync('node', [CLI, ...args], {
		encoding: 'utf-8',
		timeout: 10_000,
		env: { ...process.env, ...env },
	});

const runSafe = (args: string[], env?: Record<string, string>) => {
	try {
		const stdout = run(args, env);
		return { stdout, stderr: '', exitCode: 0 };
	} catch (err: unknown) {
		const e = err as { stdout?: string; stderr?: string; status?: number };
		return {
			stdout: e.stdout ?? '',
			stderr: e.stderr ?? '',
			exitCode: e.status ?? 1,
		};
	}
};

describe('Routes subcommand E2E', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-e2e-routes-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('routes --help lists all routes subcommands', () => {
		const out = run(['routes', '--help']);
		expect(out).toContain('Manage routes');
		expect(out).toContain('list');
		expect(out).toContain('add');
		expect(out).toContain('remove');
	});

	it('routes list --help shows list description', () => {
		const out = run(['routes', 'list', '--help']);
		expect(out).toContain('List all routes');
	});

	it('routes add --help shows add options', () => {
		const out = run(['routes', 'add', '--help']);
		expect(out).toContain('Add a route');
		expect(out).toContain('--group');
		expect(out).toContain('--path');
	});

	it('routes remove --help shows remove options', () => {
		const out = run(['routes', 'remove', '--help']);
		expect(out).toContain('Remove a route');
		expect(out).toContain('--group');
	});

	it('routes list with empty config shows "No routes configured"', () => {
		// Bootstrap a minimal global config so routes list can run
		const configDir = path.join(tmpDir, 'proxy-dev');
		fs.mkdirSync(configDir, { recursive: true });
		fs.writeFileSync(
			path.join(configDir, 'config.json'),
			JSON.stringify({
				version: 1,
				port: 443,
				groups: {},
				latency: { globalMs: 0 },
			}),
		);

		const { stdout } = runSafe(['routes', 'list'], {
			XDG_CONFIG_HOME: tmpDir,
		});
		expect(stdout).toContain('No routes configured');
	});

	it('routes add + list + remove round-trip', () => {
		const configDir = path.join(tmpDir, 'proxy-dev');
		fs.mkdirSync(configDir, { recursive: true });
		fs.writeFileSync(
			path.join(configDir, 'config.json'),
			JSON.stringify({
				version: 1,
				port: 443,
				groups: {},
				latency: { globalMs: 0 },
			}),
		);
		const env = { XDG_CONFIG_HOME: tmpDir };

		// Add a route
		const addOut = run(['routes', 'add', 'api.test', '3000'], env);
		expect(addOut).toContain('Added route');
		expect(addOut).toContain('api.test');

		// List shows the route
		const listOut = run(['routes', 'list'], env);
		expect(listOut).toContain('api.test');
		expect(listOut).toContain('3000');

		// Remove the route
		const removeOut = run(['routes', 'remove', 'api.test'], env);
		expect(removeOut).toContain('Removed route');

		// List is now empty
		const listAfter = run(['routes', 'list'], env);
		expect(listAfter).toContain('No routes configured');
	});
});
