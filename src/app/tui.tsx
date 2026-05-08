#!/usr/bin/env node
import {
	createCLI,
	fatalError,
	formatError,
	getExitCode,
	runIfMain,
} from '@yaos-git/toolkit/cli';
import { Option } from 'commander';
import { render } from 'ink';
import { App } from './index.js';
import { setup } from './setup.js';

declare const __CLI_VERSION__: string;

async function runTUI(args: string[] = process.argv.slice(2)): Promise<void> {
	const { program } = createCLI({
		name: 'proxy-dev-tui',
		description: 'Interactive TUI dashboard for proxy-dev',
		version: __CLI_VERSION__,
	});

	program
		.addOption(
			new Option('--mode <mode>', 'Config mode: local, global, or merged')
				.default('merged')
				.choices(['local', 'global', 'merged']),
		)
		.action(async (options: { mode: string }) => {
			process.env.PROXY_DEV_CONFIG_MODE = options.mode;
			await setup({ mode: options.mode });
			render(<App />);
		});

	try {
		await program.parseAsync(args, { from: 'user' });
	} catch (err) {
		if (err instanceof Error && 'exitCode' in err) {
			process.exitCode = getExitCode(err);
		} else {
			fatalError(formatError(err));
		}
	}
}

runIfMain(import.meta.url, () => {
	runTUI();
});
