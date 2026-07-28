import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = path.resolve(import.meta.dirname, '../dist/cli.js');

const run = (args: string[]) =>
	execFileSync('node', [CLI, ...args], {
		encoding: 'utf-8',
		timeout: 10_000,
	});

const runSafe = (args: string[]) => {
	try {
		const stdout = run(args);
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

describe('Daemon subcommand E2E', () => {
	it('daemon --help lists all daemon subcommands', () => {
		const out = run(['daemon', '--help']);
		expect(out).toContain('Manage the hosts daemon');
		expect(out).toContain('start');
		expect(out).toContain('status');
		expect(out).toContain('stop');
		expect(out).toContain('install');
		expect(out).toContain('uninstall');
	});

	it('daemon start --help shows start description', () => {
		const out = run(['daemon', 'start', '--help']);
		expect(out).toContain('Start the hosts daemon');
		expect(out).toContain('sudo step');
	});

	it('daemon status --help shows status description', () => {
		const out = run(['daemon', 'status', '--help']);
		expect(out).toContain('Check if daemon is running');
	});

	it('daemon status reports running or not running', () => {
		const { stdout } = runSafe(['daemon', 'status']);
		// Either state is valid — we just verify the output is a known message
		expect(stdout).toMatch(/Daemon is (running|not running)/);
	});

	it('daemon install --help shows install description', () => {
		const out = run(['daemon', 'install', '--help']);
		expect(out).toContain('Install daemon as launchd service');
	});

	it('daemon uninstall --help shows uninstall description', () => {
		const out = run(['daemon', 'uninstall', '--help']);
		expect(out).toContain('Remove daemon launchd service');
	});

	it('daemon stop --help shows stop description', () => {
		const out = run(['daemon', 'stop', '--help']);
		expect(out).toContain('Stop the hosts daemon');
	});
});
