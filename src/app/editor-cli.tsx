#!/usr/bin/env node
import { render } from 'ink';
import { App } from './index.js';
import { setup } from './setup.js';

// Parse --mode from CLI args, fall back to env var, then default to 'merged'
const VALID_MODES = ['local', 'global', 'merged'] as const;
type ConfigMode = (typeof VALID_MODES)[number];

const parseModeArg = (): ConfigMode => {
	const idx = process.argv.indexOf('--mode');
	const raw =
		idx !== -1 ? process.argv[idx + 1] : process.env.PROXY_DEV_CONFIG_MODE;
	if (raw && VALID_MODES.includes(raw as ConfigMode)) {
		return raw as ConfigMode;
	}
	return 'merged';
};

export const configMode = parseModeArg();
process.env.PROXY_DEV_CONFIG_MODE = configMode;

await setup({ mode: configMode });
render(<App />);
