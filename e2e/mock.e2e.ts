import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const CLI = path.resolve(import.meta.dirname, '../dist/cli.js');

const run = (args: string[], env?: Record<string, string>, cwd?: string) =>
	execFileSync('node', [CLI, ...args], {
		encoding: 'utf-8',
		timeout: 10_000,
		env: { ...process.env, ...env },
		cwd,
	});

describe('Mock subcommand E2E', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-e2e-mock-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('mock --help shows mock options', () => {
		const out = run(['mock', '--help']);
		expect(out).toContain('Set mock variant for a route');
		expect(out).toContain('--off');
		expect(out).toContain('<route>');
		expect(out).toContain('<variant>');
	});

	it('mock sets active variant in local config', () => {
		const out = run(['mock', 'api.local/users', 'success'], undefined, tmpDir);
		expect(out).toContain('Mock set to "success"');

		const configPath = path.join(tmpDir, 'proxy-dev.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		expect(config.mocks['api.local/users'].active).toBe('success');
	});

	it('mock --off disables mock for a route', () => {
		// First set a mock
		run(['mock', 'api.local/users', 'success'], undefined, tmpDir);

		// Then disable it
		const out = run(
			['mock', '--off', 'api.local/users', 'success'],
			undefined,
			tmpDir,
		);
		expect(out).toContain('Mock disabled');
		expect(out).toContain('live mode');

		const configPath = path.join(tmpDir, 'proxy-dev.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		expect(config.mocks['api.local/users'].active).toBeUndefined();
	});
});
