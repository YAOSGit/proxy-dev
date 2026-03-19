import type { ProxyDevCommand } from './types.js';

export const latencyConfirmCommand: ProxyDevCommand = {
	id: 'latency-confirm',
	keys: [{ specialKey: 'return' }],
	displayKey: 'Enter',
	displayText: 'confirm',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'latency',
	execute: (deps) => {
		const ms = parseInt(deps.latencyInput, 10);
		if (!Number.isNaN(ms)) {
			deps.routes.setGlobalLatency(ms);
		}
		deps.ui.closeLatencyInput();
	},
};

export const latencyOpenCommand: ProxyDevCommand = {
	id: 'latency',
	keys: [{ textKey: 't' }],
	displayKey: 't',
	displayText: 'latency',
	helpSection: 'Overlays',
	helpLabel: 'Latency',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' && deps.ui.viewLevel === 'traffic',
	execute: (deps) => {
		deps.setLatencyInput('');
		deps.ui.openLatencyInput();
	},
};
