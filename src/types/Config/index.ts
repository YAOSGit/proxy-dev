import type { LatencyConfig } from '../Latency/index.js';
import type { MockRoute, MockVariant } from '../Mock/index.js';
import type { Route, RouteGroup } from '../Route/index.js';

type GlobalConfig = {
    version: number;
    port: number;
    groups: Record<string, RouteGroup>;
    latency: LatencyConfig;
};

type LocalConfig = {
    activeGroups?: string[];
    mocks: Record<string, MockRoute>;
    latency?: LatencyConfig;
    groups?: Record<string, RouteGroup>;
};

type ResolvedConfig = {
    port: number;
    routes: ResolvedRoute[];
    latency: LatencyConfig;
    mocks: Record<string, MockRoute>;
};

type ResolvedRoute = {
    domain: string;
    path?: string;
    target: number;
    latencyMs?: number;
    mockRoute?: MockRoute;
    httpsUpgrade?: boolean;
    groupName?: string;
};

type ConfigMode = 'local' | 'global' | 'merged';
type ConfigSource = 'local' | 'global';

type TaggedRouteGroup = {
    source: ConfigSource;
    originalName: string;
    description?: string;
    routes: Route[];
};

export type {
    ConfigMode,
    ConfigSource,
    GlobalConfig,
    LocalConfig,
    ResolvedConfig,
    ResolvedRoute,
    TaggedRouteGroup,
};

