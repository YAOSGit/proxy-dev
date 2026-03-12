type Route = {
	domain: string;
	path?: string;
	target: number;
	latencyMs?: number;
	httpsUpgrade?: boolean;
};

type RouteGroup = {
	description?: string;
	routes: Route[];
};

type ResolvedRoutes = {
	port: number;
	routes: Route[];
};

export type { Route, RouteGroup, ResolvedRoutes };
