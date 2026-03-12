import type { LatencyConfig } from '../types/Latency/index.js';

const resolveLatency = (
    routeMs: number | undefined,
    global: LatencyConfig,
    variantMs?: number,
): number => variantMs ?? routeMs ?? global.globalMs;

const applyLatency = (ms: number): Promise<void> => {
    if (ms <= 0) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
};

export { resolveLatency, applyLatency };
