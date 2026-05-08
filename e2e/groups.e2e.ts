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

describe('Groups subcommand E2E', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-e2e-groups-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('groups --help lists all groups subcommands', () => {
		const out = run(['groups', '--help']);
		expect(out).toContain('Manage route groups');
		expect(out).toContain('activate');
		expect(out).toContain('deactivate');
	});

	it('groups activate --help shows activate description', () => {
		const out = run(['groups', 'activate', '--help']);
		expect(out).toContain('Activate a group');
	});

	it('groups deactivate --help shows deactivate description', () => {
		const out = run(['groups', 'deactivate', '--help']);
		expect(out).toContain('Deactivate a group');
	});

	it('groups activate + deactivate round-trip', () => {
		const activateOut = run(
			['groups', 'activate', 'staging'],
			undefined,
			tmpDir,
		);
		expect(activateOut).toContain('Activated group');
		expect(activateOut).toContain('staging');

		// Verify local config was written
		const configPath = path.join(tmpDir, 'proxy-dev.json');
		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		expect(config.activeGroups).toContain('staging');

		const deactivateOut = run(
			['groups', 'deactivate', 'staging'],
			undefined,
			tmpDir,
		);
		expect(deactivateOut).toContain('Deactivated group');

		const configAfter = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		expect(configAfter.activeGroups).not.toContain('staging');
	});
});
