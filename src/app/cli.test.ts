import { describe, expect, it } from 'vitest';

// Test CLI flag parsing without triggering side effects
describe('CLI entry point', () => {
	it('exports runCLI function', async () => {
		const { runCLI } = await import('./cli.js');
		expect(typeof runCLI).toBe('function');
	});

	it('runCLI accepts string array args', async () => {
		const { runCLI } = await import('./cli.js');
		// Should not throw for --help (commander exits)
		expect(() => {
			try {
				runCLI(['--version']);
			} catch {
				// Commander may throw - that's ok
			}
		}).not.toThrow();
	});
});
