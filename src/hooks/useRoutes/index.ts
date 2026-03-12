import { useCallback, useState } from 'react';
import type { ConfigMode, ConfigSource, GlobalConfig, LocalConfig, ResolvedConfig, ResolvedRoute, TaggedRouteGroup } from '../../types/Config/index.js';
import type { MockRoute } from '../../types/Mock/index.js';
import type { LatencyConfig } from '../../types/Latency/index.js';
import {
	loadGlobalConfig,
	loadLocalConfig,
	resolveRoutes,
	saveGlobalConfig,
	saveLocalConfig,
} from '../../utils/config/index.js';

type RouteState = {
	mode: ConfigMode;
	taggedGroups: Record<string, TaggedRouteGroup>;
	global: GlobalConfig;
	local: LocalConfig | null;
	routes: ResolvedRoute[];
	latency: LatencyConfig;
	mocks: Record<string, MockRoute>;
	resolved: ResolvedConfig;
};

type UseRoutesReturn = {
	mode: ConfigMode;
	taggedGroups: Record<string, TaggedRouteGroup>;
	global: GlobalConfig;
	local: LocalConfig | null;
	routes: ResolvedRoute[];
	latency: LatencyConfig;
	mocks: Record<string, MockRoute>;
	resolved: ResolvedConfig;
	reload: () => void;
	toggleGroup: (groupName: string) => void;
	updateGlobal: (global: GlobalConfig) => void;
	updateLocalGroups: (groups: GlobalConfig['groups']) => void;
	setMockVariant: (routeKey: string, variantName: string | null) => void;
	setRouteLatency: (domain: string, path: string | undefined, ms: number | undefined) => void;
	setGlobalLatency: (ms: number) => void;
};

const useRoutes = (mode: ConfigMode = 'merged'): UseRoutesReturn => {
	const tagGroups = (
		groups: Record<string, { description?: string; routes: Array<{ domain: string; path?: string; target: number; latencyMs?: number; httpsUpgrade?: boolean }> }>,
		source: ConfigSource,
		prefix: boolean,
	): Record<string, TaggedRouteGroup> => {
		const tagged: Record<string, TaggedRouteGroup> = {};
		for (const [name, group] of Object.entries(groups)) {
			const key = prefix ? `${source}:${name}` : name;
			tagged[key] = {
				source,
				originalName: name,
				description: group.description,
				routes: group.routes,
			};
		}
		return tagged;
	};

	const loadState = (): RouteState => {
		const global = loadGlobalConfig();
		const local = loadLocalConfig();

		// Build effective groups and tagged groups based on mode
		let effectiveGroups: GlobalConfig['groups'];
		let taggedGroups: Record<string, TaggedRouteGroup>;
		if (mode === 'global') {
			effectiveGroups = global.groups;
			taggedGroups = tagGroups(global.groups, 'global', false);
		} else if (mode === 'local') {
			effectiveGroups = local?.groups ?? {};
			taggedGroups = tagGroups(effectiveGroups, 'local', false);
		} else {
			effectiveGroups = { ...global.groups, ...(local?.groups ?? {}) };
			const globalTagged = tagGroups(global.groups, 'global', true);
			const localTagged = local ? tagGroups(local.groups ?? {}, 'local', true) : {};
			taggedGroups = { ...globalTagged, ...localTagged };
		}

		const effectiveGlobal: GlobalConfig = { ...global, groups: effectiveGroups };
		const routes = resolveRoutes(effectiveGlobal, local);
		const latency = mode === 'global' ? global.latency : (local?.latency ?? global.latency);
		const mocks = mode === 'global' ? {} : (local?.mocks ?? {});

		const resolved: ResolvedConfig = {
			port: global.port,
			routes,
			latency,
			mocks,
		};

		return {
			mode,
			taggedGroups,
			global,
			local,
			routes,
			latency,
			mocks,
			resolved,
		};
	};

	const [state, setState] = useState<RouteState>(loadState);

	const reload = useCallback(() => setState(loadState()), []);

	const toggleGroup = useCallback(
		(groupName: string) => {
			const local = state.local ?? { mocks: {} };
			const active = new Set(local.activeGroups ?? Object.keys(state.global.groups));
			if (active.has(groupName)) {
				active.delete(groupName);
			} else {
				active.add(groupName);
			}
			const updated: LocalConfig = { ...local, activeGroups: [...active] };
			saveLocalConfig(updated);
			setState(loadState());
		},
		[state],
	);

	const setMockVariant = useCallback(
		(routeKey: string, variantName: string | null) => {
			const local = state.local ?? { mocks: {} };
			const mocks = { ...local.mocks };
			if (!mocks[routeKey]) mocks[routeKey] = { variants: {} };
			const mockRoute = { ...mocks[routeKey]! };
			mockRoute.active = variantName ?? undefined;
			mocks[routeKey] = mockRoute;
			const updated: LocalConfig = { ...local, mocks };
			saveLocalConfig(updated);
			setState(loadState());
		},
		[state],
	);

	const setRouteLatency = useCallback(
		(domain: string, path: string | undefined, ms: number | undefined) => {
			const global = { ...state.global };
			for (const group of Object.values(global.groups)) {
				for (const route of group.routes) {
					if (route.domain === domain && route.path === path) {
						route.latencyMs = ms;
					}
				}
			}
			saveGlobalConfig(global);
			setState(loadState());
		},
		[state],
	);

	const setGlobalLatency = useCallback(
		(ms: number) => {
			const global = { ...state.global, latency: { globalMs: ms } };
			saveGlobalConfig(global);
			setState(loadState());
		},
		[state],
	);

	const updateGlobal = useCallback(
		(global: GlobalConfig) => {
			saveGlobalConfig(global);
			setState(loadState());
		},
		[],
	);

	const updateLocalGroups = useCallback(
		(groups: GlobalConfig['groups']) => {
			const local = state.local ?? { mocks: {} };
			const updated: LocalConfig = { ...local, groups };
			saveLocalConfig(updated);
			setState(loadState());
		},
		[state],
	);

	return {
		...state,
		reload,
		toggleGroup,
		updateGlobal,
		updateLocalGroups,
		setMockVariant,
		setRouteLatency,
		setGlobalLatency,
	};
};

export { useRoutes };
export type { UseRoutesReturn };
