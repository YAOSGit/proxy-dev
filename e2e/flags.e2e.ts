import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const CLI = path.resolve(import.meta.dirname, '../dist/cli.js');

const run = (args: string[]) =>
	execFileSync('node', [CLI, ...args], {
		encoding: 'utf-8',
		timeout: 10_000,
	});

const runFailing = (args: string[]) => {
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

describe('CLI Flags E2E', () => {
	it('--help shows usage text and all top-level commands', () => {
		const out = run(['--help']);
		expect(out).toContain('Usage: proxy-dev');
		expect(out).toContain('Local-first reverse proxy');
		expect(out).toContain('trust');
		expect(out).toContain('daemon');
		expect(out).toContain('routes');
		expect(out).toContain('groups');
		expect(out).toContain('mock');
		expect(out).toContain('start');
		expect(out).toContain('stop');
	});

	it('--version shows version string with name, node, and platform', () => {
		const out = run(['--version']);
		expect(out).toMatch(/proxy-dev\/\d+\.\d+\.\d+/);
		expect(out).toContain('node/');
		expect(out).toContain(process.platform);
	});

	it('unknown flag produces error', () => {
		const { stderr, exitCode } = runFailing(['--nonexistent-flag']);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain('unknown option');
	});

	it('help command works as alias for --help', () => {
		const out = run(['help']);
		expect(out).toContain('Usage: proxy-dev');
	});
});
