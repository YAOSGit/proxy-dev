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

describe('Trust subcommand E2E', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-e2e-trust-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('trust --help lists all trust subcommands', () => {
		const out = run(['trust', '--help']);
		expect(out).toContain('Manage CA trust');
		expect(out).toContain('init');
		expect(out).toContain('system');
		expect(out).toContain('firefox');
		expect(out).toContain('node');
		expect(out).toContain('python');
		expect(out).toContain('java');
		expect(out).toContain('deno');
		expect(out).toContain('openssl');
		expect(out).toContain('status');
	});

	it('trust init --help shows init options', () => {
		const out = run(['trust', 'init', '--help']);
		expect(out).toContain('Generate CA certificate');
		expect(out).toContain('bootstrap global config');
	});

	it('trust system --help shows system trust description', () => {
		const out = run(['trust', 'system', '--help']);
		expect(out).toContain('Add CA to OS trust store');
	});

	it('trust node --help shows Node.js trust description', () => {
		const out = run(['trust', 'node', '--help']);
		expect(out).toContain('NODE_EXTRA_CA_CERTS');
	});

	it('trust python --help shows Python trust description', () => {
		const out = run(['trust', 'python', '--help']);
		expect(out).toContain('REQUESTS_CA_BUNDLE');
	});

	it('trust java --help shows Java trust description', () => {
		const out = run(['trust', 'java', '--help']);
		expect(out).toContain('JVM keystore');
	});

	it('trust deno --help shows Deno trust description', () => {
		const out = run(['trust', 'deno', '--help']);
		expect(out).toContain('DENO_CERT');
	});

	it('trust openssl --help shows OpenSSL trust description', () => {
		const out = run(['trust', 'openssl', '--help']);
		expect(out).toContain('SSL_CERT_FILE');
	});

	it('trust status without CA shows "No CA found" message', () => {
		const { stdout, exitCode } = runSafe(['trust', 'status'], {
			XDG_CONFIG_HOME: tmpDir,
		});
		expect(exitCode).not.toBe(0);
		expect(stdout).toContain('No CA found');
	});
});
