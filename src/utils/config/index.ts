import fs from 'node:fs';
import path from 'node:path';
import { atomicWrite } from '@yaos-git/toolkit/cli';
import type {
	ConfigMode,
	ConfigSource,
	GlobalConfig,
	LocalConfig,
	ResolvedConfig,
	ResolvedRoute,
	TaggedRouteGroup,
} from '../../types/Config/index.js';
import type { LatencyConfig } from '../../types/Latency/index.js';
import type { MockRoute } from '../../types/Mock/index.js';
import type { RouteGroup } from '../../types/Route/index.js';
import { getGlobalConfigPath } from '../platform/index.js';
import { INITIAL_GLOBAL_CONFIG } from './initialConfig.consts.js';
import { globalConfigSchema, localConfigSchema } from './schemas.js';

const LOCAL_CONFIG_FILENAME = 'proxy-dev.json';

const validateGlobalConfig = (data: unknown): GlobalConfig => {
	return globalConfigSchema.parse(data) as GlobalConfig;
};

const validateLocalConfig = (data: unknown): LocalConfig => {
	return localConfigSchema.parse(data) as LocalConfig;
};

const configWarnings: string[] = [];

const getConfigWarnings = (): string[] => [...configWarnings];

const clearConfigWarnings = (): void => {
	configWarnings.length = 0;
};

const loadGlobalConfig = (): GlobalConfig => {
	const configPath = getGlobalConfigPath();
	if (!fs.existsSync(configPath)) {
		return { ...INITIAL_GLOBAL_CONFIG };
	}
	try {
		const raw = fs.readFileSync(configPath, 'utf-8');
		const data = JSON.parse(raw);
		return validateGlobalConfig(data);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		const warning = `Global config invalid: ${msg}. Using defaults.`;
		configWarnings.push(warning);
		console.warn(`[config] ${warning}`);
		return { ...INITIAL_GLOBAL_CONFIG };
	}
};

const loadLocalConfig = (cwd?: string): LocalConfig | null => {
	const dir = cwd ?? process.cwd();
	const configPath = path.join(dir, LOCAL_CONFIG_FILENAME);
	if (!fs.existsSync(configPath)) {
		return null;
	}
	try {
		const raw = fs.readFileSync(configPath, 'utf-8');
		const data = JSON.parse(raw);
		return validateLocalConfig(data);
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		const warning = `Local config invalid: ${msg}. Ignoring.`;
		configWarnings.push(warning);
		console.warn(`[config] ${warning}`);
		return null;
	}
};

const atomicWriteWithDir = (filePath: string, content: string): void => {
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });
	atomicWrite(filePath, content);
};

const saveGlobalConfig = (config: GlobalConfig): void => {
	const result = globalConfigSchema.safeParse(config);
	if (!result.success) {
		console.error(
			`[config] Refusing to save invalid global config: ${result.error.message}`,
		);
		return;
	}
	const configPath = getGlobalConfigPath();
	atomicWriteWithDir(configPath, JSON.stringify(result.data, null, '\t'));
};

const saveLocalConfig = (config: LocalConfig, cwd?: string): void => {
	const result = localConfigSchema.safeParse(config);
	if (!result.success) {
		console.error(
			`[config] Refusing to save invalid local config: ${result.error.message}`,
		);
		return;
	}
	const dir = cwd ?? process.cwd();
	const configPath = path.join(dir, LOCAL_CONFIG_FILENAME);
	atomicWriteWithDir(configPath, JSON.stringify(result.data, null, '\t'));
};

const bootstrapGlobalConfig = (): void => {
	const configPath = getGlobalConfigPath();
	if (!fs.existsSync(configPath)) {
		saveGlobalConfig(INITIAL_GLOBAL_CONFIG);
	}
};

const resolveRoutes = (
	global: GlobalConfig,
	local: LocalConfig | null,
): ResolvedRoute[] => {
	const activeGroups = local?.activeGroups;
	const routes: ResolvedRoute[] = [];

	for (const [groupName, group] of Object.entries(global.groups)) {
		if (activeGroups === undefined || activeGroups.includes(groupName)) {
			for (const route of group.routes) {
				const routeKey = route.path
					? `${route.domain}${route.path}`
					: route.domain;
				const mockRoute = local?.mocks[routeKey];
				routes.push({
					...route,
					mockRoute,
					groupName,
				});
			}
		}
	}
	return routes;
};

const mergeConfigs = (
	global: GlobalConfig,
	local: LocalConfig | null,
): ResolvedConfig => {
	const routes = resolveRoutes(global, local);
	const latency = local?.latency ?? global.latency;
	const mocks = local?.mocks ?? {};

	return {
		port: global.port,
		routes,
		latency,
		mocks,
	};
};

type ConfigByModeResult = {
	mode: ConfigMode;
	groups: Record<string, TaggedRouteGroup>;
	port: number;
	latency: LatencyConfig;
	mocks: Record<string, MockRoute>;
	localActiveGroups?: string[];
};

const tagGroups = (
	groups: Record<string, RouteGroup>,
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

const bootstrapLocalConfig = (cwd?: string): LocalConfig => {
	const dir = cwd ?? process.cwd();
	const configPath = path.join(dir, LOCAL_CONFIG_FILENAME);
	const config: LocalConfig = { mocks: {} };
	atomicWriteWithDir(configPath, JSON.stringify(config, null, '\t'));
	return config;
};

const loadConfigByMode = (
	mode: ConfigMode,
	cwd?: string,
): ConfigByModeResult => {
	if (mode === 'global') {
		const global = loadGlobalConfig();
		return {
			mode,
			groups: tagGroups(global.groups, 'global', false),
			port: global.port,
			latency: global.latency,
			mocks: {},
		};
	}

	if (mode === 'local') {
		let local = loadLocalConfig(cwd);
		if (!local) {
			local = bootstrapLocalConfig(cwd);
		}
		const groups = local.groups ?? {};
		return {
			mode,
			groups: tagGroups(groups, 'local', false),
			port: 443,
			latency: local.latency ?? { globalMs: 0 },
			mocks: local.mocks,
			localActiveGroups: local.activeGroups,
		};
	}

	// merged
	const global = loadGlobalConfig();
	const local = loadLocalConfig(cwd);
	const globalGroups = tagGroups(global.groups, 'global', true);
	const localGroups = local ? tagGroups(local.groups ?? {}, 'local', true) : {};

	return {
		mode,
		groups: { ...globalGroups, ...localGroups },
		port: global.port,
		latency: local?.latency ?? global.latency,
		mocks: local?.mocks ?? {},
		localActiveGroups: local?.activeGroups,
	};
};

export type { ConfigByModeResult };
export {
	bootstrapGlobalConfig,
	bootstrapLocalConfig,
	clearConfigWarnings,
	getConfigWarnings,
	loadConfigByMode,
	loadGlobalConfig,
	loadLocalConfig,
	mergeConfigs,
	resolveRoutes,
	saveGlobalConfig,
	saveLocalConfig,
	validateGlobalConfig,
	validateLocalConfig,
};
