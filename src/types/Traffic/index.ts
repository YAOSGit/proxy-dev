type TrafficEntry = {
    id: string;
    timestamp: number;
    method: string;
    domain: string;
    path: string;
    status: number;
    latencyMs: number;
    routeState: 'LIVE' | 'MOCK';
    requestHeaders: Record<string, string>;
    requestBody?: string;
    responseHeaders: Record<string, string>;
    responseBody?: string;
    mockVariant?: string;
};

export type { TrafficEntry };
