import {
	addMockToLocalConfig,
	buildMockFilePath,
	defaultVariantName,
	writeMockFile,
} from '../utils/snapshot/index.js';
import type { ProxyDevCommand } from './types.js';

export const snapshotCommand: ProxyDevCommand = {
	id: 'snapshot',
	keys: [{ textKey: 's' }],
	displayKey: 's',
	displayText: 'snapshot',
	helpSection: 'Overlays',
	helpLabel: 'Snapshot as mock',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' &&
		deps.ui.viewLevel === 'traffic' &&
		deps.selectedEntry !== null &&
		deps.selectedEntry.responseBody !== undefined,
	execute: (deps) => {
		const entry = deps.selectedEntry;
		if (!entry) return;
		try {
			const variantName = defaultVariantName(entry.status);
			const filePath = buildMockFilePath(entry.domain, entry.path, variantName);
			writeMockFile(
				filePath,
				entry.responseBody ?? '',
				entry.status,
				entry.responseHeaders,
			);
			addMockToLocalConfig(
				'proxy-dev.json',
				`${entry.domain}${entry.path || ''}`,
				variantName,
				{
					file: `./${filePath}`,
					status: entry.status,
				},
			);
			deps.routes.reload();
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			deps.ui.openConfirm(`Snapshot failed: ${msg}`, () =>
				deps.ui.closeConfirm(),
			);
		}
	},
};

export const clearCommand: ProxyDevCommand = {
	id: 'clear',
	keys: [{ textKey: 'x' }],
	displayKey: 'x',
	displayText: 'clear',
	helpSection: 'Traffic',
	helpLabel: 'Clear traffic log',
	footer: 'priority',
	isEnabled: (deps) =>
		deps.ui.activeOverlay === 'none' &&
		deps.ui.viewLevel === 'traffic' &&
		deps.traffic.entries.length > 0,
	execute: (deps) => deps.traffic.clear(),
};

export const reloadCommand: ProxyDevCommand = {
	id: 'reload',
	keys: [{ textKey: 'r' }],
	displayKey: 'r',
	displayText: 'reload',
	helpSection: 'General',
	helpLabel: 'Reload config',
	footer: 'priority',
	isEnabled: (deps) => deps.ui.activeOverlay === 'none',
	execute: (deps) => deps.routes.reload(),
};
