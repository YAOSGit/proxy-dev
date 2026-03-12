import { Box, useInput, useStdout } from 'ink';
import { useEffect, useState } from 'react';
import { ControlBar } from '../components/ControlBar/index.js';
import { ConfirmDialog } from '../components/ConfirmDialog/index.js';
import { DetailInspector } from '../components/DetailInspector/index.js';
import { HelpMenu } from '../components/HelpMenu/index.js';
import { LatencyInput } from '../components/LatencyInput/index.js';
import { MockPicker } from '../components/MockPicker/index.js';
import { RouteConfig } from '../components/RouteConfig/index.js';
import { SummaryBar } from '../components/SummaryBar/index.js';
import { SystemHeader } from '../components/SystemHeader/index.js';
import { TrafficTable } from '../components/TrafficTable/index.js';
import { useTrafficContext } from '../providers/TrafficProvider/index.js';
import { useRoutesContext } from '../providers/RoutesProvider/index.js';
import { useUIStateContext } from '../providers/UIStateProvider/index.js';
import { useHostsContext } from '../providers/HostsProvider/index.js';
import { useProxyContext } from '../providers/ProxyProvider/index.js';
import { checkTrustStatus } from '../ssl/index.js';
import { getCertsDir, getLeavesDir } from '../utils/platform/index.js';
import { getConfigWarnings } from '../utils/config/index.js';
import { buildMockFilePath, defaultVariantName, writeMockFile, addMockToLocalConfig } from '../utils/snapshot/index.js';
import path from 'node:path';
import type { Command } from '../types/Command/index.js';

declare const __CLI_VERSION__: string;

// Chrome overhead: outer border (2) + header border (3) + footer border (3) + summary (3)
const CHROME_LINES = 11;

export function AppContent() {
	const traffic = useTrafficContext();
	const routes = useRoutesContext();
	const ui = useUIStateContext();
	const hosts = useHostsContext();
	const proxy = useProxyContext();
	const { stdout } = useStdout();
	const [startTime] = useState(() => Date.now());
	const [now, setNow] = useState(() => Date.now());
	const [caTrusted, setCaTrusted] = useState(false);
	const [latencyInput, setLatencyInput] = useState('');

	const terminalHeight = stdout?.rows ?? 24;
	const terminalWidth = stdout?.columns ?? 80;
	const effectiveWidth = terminalWidth;
	const contentHeight = Math.max(1, terminalHeight - CHROME_LINES);

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(Date.now());
			const certsDir = getCertsDir();
			const caPath = path.join(certsDir, 'ca.crt');
			setCaTrusted(checkTrustStatus(caPath));
		}, 2000);
		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (proxy.status === 'stopped' && routes.resolved) {
			const certsDir = getCertsDir();
			const leavesDir = getLeavesDir();
			proxy.startProxy(routes.resolved, {
				caCert: path.join(certsDir, 'ca.crt'),
				leavesDir,
			});
		} else if (proxy.status === 'running' && routes.resolved) {
			proxy.updateRoutes(routes.resolved);
		}
	}, [proxy.status, routes.resolved]);

	const selectedEntry = traffic.getSelectedEntry();
	const isOverlayOpen = ui.showConfirm || ui.showMockPicker || ui.showLatencyInput || ui.showRouteConfig || ui.showHelp;

	// Build commands — order matters: first match in the loop wins.
	// Overlay-specific commands go before general commands so they take priority.
	const commands: Command[] = [
		// Confirm dialog
		{
			id: 'confirm-yes',
			keys: ['y'],
			displayKey: 'y',
			displayText: 'yes',
			footer: true,
			isEnabled: () => ui.showConfirm,
			execute: () => {
				ui.confirmCallback?.();
				ui.closeConfirm();
			},
		},
		{
			id: 'confirm-no',
			keys: ['n'],
			displayKey: 'n',
			displayText: 'no',
			footer: true,
			isEnabled: () => ui.showConfirm,
			execute: () => ui.closeConfirm(),
		},

		// Route config overlay (display-only — actual handling lives in RouteConfig's useInput)
		{
			id: 'rc-navigate',
			keys: ['upArrow', 'downArrow'],
			displayKey: '↑↓',
			displayText: 'navigate',
			footer: true,
			isEnabled: () => ui.showRouteConfig,
			execute: () => {},
		},
		{
			id: 'rc-select',
			keys: ['return'],
			displayKey: 'Enter',
			displayText: 'select',
			footer: true,
			isEnabled: () => ui.showRouteConfig,
			execute: () => {},
		},
		{
			id: 'rc-toggle-group',
			keys: ['g'],
			displayKey: 'g',
			displayText: 'toggle',
			footer: true,
			isEnabled: () => ui.showRouteConfig,
			execute: () => {},
		},
		{
			id: 'rc-toggle-upgrade',
			keys: ['s'],
			displayKey: 's',
			displayText: 'upgrade',
			footer: true,
			isEnabled: () => ui.showRouteConfig,
			execute: () => {},
		},
		{
			id: 'rc-delete',
			keys: ['d'],
			displayKey: 'd',
			displayText: 'delete',
			footer: true,
			isEnabled: () => ui.showRouteConfig,
			execute: () => {},
		},

		// Latency input overlay
		{
			id: 'latency-confirm',
			keys: ['return'],
			displayKey: 'Enter',
			displayText: 'confirm',
			footer: true,
			isEnabled: () => ui.showLatencyInput,
			execute: () => {
				const ms = parseInt(latencyInput, 10);
				if (!isNaN(ms)) {
					routes.setGlobalLatency(ms);
				}
				ui.closeLatencyInput();
			},
		},

		// Traffic navigation
		{
			id: 'navigate-up',
			keys: ['upArrow', 'k'],
			displayKey: '↑',
			displayText: 'up',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic',
			execute: () => traffic.selectIndex(Math.max(0, traffic.selectedIndex - 1)),
		},
		{
			id: 'navigate-down',
			keys: ['downArrow', 'j'],
			displayKey: '↓',
			displayText: 'down',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic',
			execute: () => traffic.selectIndex(Math.min(traffic.entries.length - 1, traffic.selectedIndex + 1)),
		},
		{
			id: 'inspect',
			keys: ['return'],
			displayKey: 'Enter',
			displayText: 'inspect',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic' && selectedEntry !== null,
			execute: () => ui.openDetail(),
		},

		// Back/Escape (works across views and overlays)
		{
			id: 'back',
			keys: ['escape'],
			displayKey: 'Esc',
			displayText: 'back',
			footer: true,
			isEnabled: () => ui.viewLevel === 'detail' || ui.showMockPicker || ui.showLatencyInput || ui.showHelp || ui.showRouteConfig || ui.showConfirm,
			execute: () => {
				if (ui.showConfirm) ui.closeConfirm();
				else if (ui.showHelp) ui.closeHelp();
				else if (ui.showMockPicker) ui.closeMockPicker();
				else if (ui.showLatencyInput) ui.closeLatencyInput();
				else if (ui.showRouteConfig) ui.closeRouteConfig();
				else ui.closeDetail();
			},
		},

		// Detail view
		{
			id: 'tab-switch',
			keys: ['tab'],
			displayKey: 'Tab',
			displayText: 'switch pane',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'detail',
			execute: () => ui.switchDetailPane(),
		},
		{
			id: 'scroll-up',
			keys: ['upArrow', 'k'],
			displayKey: '↑',
			displayText: 'scroll up',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'detail',
			execute: () => ui.scroll(-1),
		},
		{
			id: 'scroll-down',
			keys: ['downArrow', 'j'],
			displayKey: '↓',
			displayText: 'scroll down',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'detail',
			execute: () => ui.scroll(1),
		},

		// Overlay openers
		{
			id: 'mock-picker',
			keys: ['m'],
			displayKey: 'm',
			displayText: 'mock',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic' && selectedEntry !== null,
			execute: () => ui.openMockPicker(),
		},
		{
			id: 'latency',
			keys: ['t'],
			displayKey: 't',
			displayText: 'latency',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic',
			execute: () => { setLatencyInput(''); ui.openLatencyInput(); },
		},
		{
			id: 'help',
			keys: ['h'],
			displayKey: 'h',
			displayText: 'help',
			footer: true,
			isEnabled: () => !isOverlayOpen,
			execute: () => ui.openHelp(),
		},
		{
			id: 'route-config',
			keys: ['c'],
			displayKey: 'c',
			displayText: 'routes',
			footer: true,
			isEnabled: () => !isOverlayOpen,
			execute: () => ui.openRouteConfig(),
		},

		// Actions
		{
			id: 'snapshot',
			keys: ['s'],
			displayKey: 's',
			displayText: 'snapshot',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic' && selectedEntry !== null && selectedEntry.responseBody !== undefined,
			execute: () => {
				if (!selectedEntry) return;
				try {
					const variantName = defaultVariantName(selectedEntry.status);
					const filePath = buildMockFilePath(selectedEntry.domain, selectedEntry.path, variantName);
					writeMockFile(filePath, selectedEntry.responseBody ?? '', selectedEntry.status, selectedEntry.responseHeaders);
					addMockToLocalConfig('proxy-dev.json', `${selectedEntry.domain}${selectedEntry.path || ''}`, variantName, {
						file: `./${filePath}`,
						status: selectedEntry.status,
					});
					routes.reload();
				} catch (err) {
					const msg = err instanceof Error ? err.message : String(err);
					ui.openConfirm(`Snapshot failed: ${msg}`, () => ui.closeConfirm());
				}
			},
		},
		{
			id: 'clear',
			keys: ['x'],
			displayKey: 'x',
			displayText: 'clear',
			footer: true,
			isEnabled: () => !isOverlayOpen && ui.viewLevel === 'traffic' && traffic.entries.length > 0,
			execute: () => traffic.clear(),
		},

		// Reload
		{
			id: 'reload',
			keys: ['r'],
			displayKey: 'r',
			displayText: 'reload',
			footer: true,
			isEnabled: () => !isOverlayOpen,
			execute: () => routes.reload(),
		},

		// Quit
		{
			id: 'quit',
			keys: ['q'],
			displayKey: 'q',
			displayText: 'quit',
			footer: true,
			isEnabled: () => !ui.showConfirm,
			execute: () => ui.openConfirm('Are you sure you want to quit proxy-dev?', () => process.exit(0)),
		},
	];

	useInput((input, key) => {
		for (const cmd of commands) {
			if (!cmd.isEnabled()) continue;
			const pressed = key.return ? 'return' : key.escape ? 'escape' : key.tab ? 'tab' : key.upArrow ? 'upArrow' : key.downArrow ? 'downArrow' : input;
			if (cmd.keys.includes(pressed)) {
				cmd.execute();
				return;
			}
		}

		// Handle latency input typing (digits and backspace only)
		if (ui.showLatencyInput) {
			if (/^\d$/.test(input)) {
				setLatencyInput((prev) => prev + input);
			} else if (key.backspace || key.delete) {
				setLatencyInput((prev) => prev.slice(0, -1));
			}
		}
	});

	// Render the content area (overlays replace content, chrome stays)
	const renderContent = () => {
		if (ui.showHelp) {
			return <HelpMenu onClose={ui.closeHelp} />;
		}

		if (ui.showRouteConfig) {
			// In local mode, build a virtual GlobalConfig from local groups
			// so RouteConfig edits save to proxy-dev.json instead of global config
			const configForRoutes = routes.mode === 'local'
				? { ...routes.global, groups: routes.local?.groups ?? {} }
				: routes.global;
			const updateForRoutes = routes.mode === 'local'
				? (g: typeof routes.global) => routes.updateLocalGroups(g.groups)
				: routes.updateGlobal;
			return (
				<RouteConfig
					global={configForRoutes}
					updateGlobal={updateForRoutes}
					activeGroups={routes.local?.activeGroups}
					onToggleGroup={routes.toggleGroup}
					onClose={ui.closeRouteConfig}
					configMode={routes.mode}
					taggedGroups={routes.taggedGroups}
				/>
			);
		}

		if (ui.showMockPicker && selectedEntry) {
			const routeKey = selectedEntry.path ? `${selectedEntry.domain}${selectedEntry.path}` : selectedEntry.domain;
			const mockRoute = routes.mocks[routeKey] ?? null;
			return (
				<MockPicker
					routeKey={routeKey}
					mockRoute={mockRoute}
					onSelect={(variant) => {
						routes.setMockVariant(routeKey, variant);
						ui.closeMockPicker();
					}}
					onClose={ui.closeMockPicker}
				/>
			);
		}

		if (ui.showLatencyInput) {
			return (
				<LatencyInput
					currentMs={routes.latency.globalMs}
					isGlobal={true}
					onConfirm={(ms) => {
						routes.setGlobalLatency(ms);
						ui.closeLatencyInput();
					}}
					onClose={ui.closeLatencyInput}
					inputValue={latencyInput}
					onInputChange={setLatencyInput}
				/>
			);
		}

		if (ui.showConfirm) {
			return <ConfirmDialog message={ui.confirmMessage} />;
		}

		if (ui.viewLevel === 'detail' && selectedEntry) {
			return (
				<DetailInspector
					entry={selectedEntry}
					activePane={ui.activeDetailPane}
					scrollOffset={ui.scrollOffset}
					onClose={ui.closeDetail}
					onSwitchPane={ui.switchDetailPane}
				/>
			);
		}

		// Default: traffic view
		return (
			<>
				<TrafficTable
					entries={traffic.entries}
					selectedIndex={traffic.selectedIndex}
					height={contentHeight}
					domains={hosts.activeDomains}
				/>
				<SummaryBar entry={selectedEntry} />
			</>
		);
	};

	return (
		<Box
			flexDirection="column"
			paddingX={1}
			borderStyle="round"
			borderColor="blue"
			width={effectiveWidth}
			height={terminalHeight}
		>
			<SystemHeader
				uptimeMs={now - startTime}
				hostCount={hosts.activeDomains.length}
				caTrusted={caTrusted}
				port={routes.global.port}
				proxyStatus={proxy.status}
				lastError={proxy.lastError}
				configMode={routes.mode}
				version={__CLI_VERSION__}
				configWarnings={getConfigWarnings()}
			/>
			<Box flexDirection="column" flexGrow={1}>
				{renderContent()}
			</Box>
			<ControlBar commands={commands} width={effectiveWidth - 4} />
		</Box>
	);
}
