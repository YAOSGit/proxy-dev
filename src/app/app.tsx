import path from 'node:path';
import { useInput, useStdout } from 'ink';
import { useEffect, useMemo, useState } from 'react';
import { TUILayout } from '@yaos-git/toolkit/tui/components';
import { COMMANDS, CommandsProvider } from '../commands/index.js';
import type { ProxyDevDeps } from '../commands/types.js';
import { DetailInspector } from '../components/DetailInspector/index.js';
import { LatencyInput } from '../components/LatencyInput/index.js';
import { MockPicker } from '../components/MockPicker/index.js';
import { RouteConfig } from '../components/RouteConfig/index.js';
import { SummaryBar } from '../components/SummaryBar/index.js';
import { SystemHeader } from '../components/SystemHeader/index.js';
import { TrafficTable } from '../components/TrafficTable/index.js';
import { useHostsContext } from '../providers/HostsProvider/index.js';
import { useProxyContext } from '../providers/ProxyProvider/index.js';
import { useRoutesContext } from '../providers/RoutesProvider/index.js';
import { useTrafficContext } from '../providers/TrafficProvider/index.js';
import { useUIStateContext } from '../providers/UIStateProvider/index.js';
import { checkTrustStatus } from '../ssl/index.js';
import { theme } from '../theme.js';
import { getConfigWarnings } from '../utils/config/index.js';
import { getCertsDir, getLeavesDir } from '../utils/platform/index.js';
import { HELP_SECTION_COLORS } from './app.consts.js';

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
	}, [proxy.status, routes.resolved, proxy.startProxy, proxy.updateRoutes]);

	const selectedEntry = traffic.getSelectedEntry();
	const isOverlayOpen = ui.activeOverlay !== 'none';

	const onQuit = useMemo(() => () => process.exit(0), []);

	const deps: ProxyDevDeps = useMemo(
		() => ({
			ui,
			traffic,
			routes,
			hosts,
			proxy,
			selectedEntry,
			isOverlayOpen,
			latencyInput,
			setLatencyInput,
			onQuit,
		}),
		[
			ui,
			traffic,
			routes,
			hosts,
			proxy,
			selectedEntry,
			isOverlayOpen,
			latencyInput,
			onQuit,
		],
	);

	const overlays = useMemo(
		() => ({
			routeConfig: () => {
				// In local mode, build a virtual GlobalConfig from local groups
				// so RouteConfig edits save to proxy-dev.json instead of global config
				const configForRoutes =
					routes.mode === 'local'
						? { ...routes.global, groups: routes.local?.groups ?? {} }
						: routes.global;
				const updateForRoutes =
					routes.mode === 'local'
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
			},
			mock: () => {
				if (!selectedEntry) return null;
				const routeKey = selectedEntry.path
					? `${selectedEntry.domain}${selectedEntry.path}`
					: selectedEntry.domain;
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
			},
			latency: () => (
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
			),
		}),
		[routes, ui, selectedEntry, latencyInput],
	);

	const header = (
		<SystemHeader
			uptimeMs={now - startTime}
			hostCount={hosts.activeDomains.length}
			caTrusted={caTrusted}
			port={routes.global.port}
			proxyStatus={proxy.status}
			lastError={proxy.lastError}
			configMode={routes.mode}
			configWarnings={getConfigWarnings()}
		/>
	);

	const content =
		ui.viewLevel === 'detail' && selectedEntry ? (
			<DetailInspector
				entry={selectedEntry}
				activePane={ui.activeDetailPane}
				scrollOffset={ui.scrollOffset}
				onClose={ui.closeDetail}
				onSwitchPane={ui.switchDetailPane}
			/>
		) : (
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

	return (
		<CommandsProvider deps={deps}>
			<TUILayout
				brand="proxy"
				theme={theme}
				commands={COMMANDS}
				deps={deps}
				helpTitle="YAOSGit proxy - Keyboard Shortcuts"
				helpSectionColors={HELP_SECTION_COLORS}
				overlays={overlays}
				header={header}
				statusBar={null}
			>
				{content}
			</TUILayout>
			<LatencyInputHandler showLatencyInput={ui.activeOverlay === 'latency'} setLatencyInput={setLatencyInput} />
		</CommandsProvider>
	);
}

/**
 * Handles latency digit/backspace input when the latency overlay is active.
 * Separated so it doesn't conflict with the CommandsProvider's useInput.
 */
const LatencyInputHandler = ({
	showLatencyInput,
	setLatencyInput,
}: {
	showLatencyInput: boolean;
	setLatencyInput: (fn: string | ((prev: string) => string)) => void;
}) => {
	useInput((input, key) => {
		if (!showLatencyInput) return;
		if (/^\d$/.test(input)) {
			setLatencyInput((prev) => prev + input);
		} else if (key.backspace || key.delete) {
			setLatencyInput((prev) => prev.slice(0, -1));
		}
	});

	return null;
};
