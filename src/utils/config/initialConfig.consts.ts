import type { GlobalConfig } from '../../types/Config/index.js';

const INITIAL_GLOBAL_CONFIG: GlobalConfig = {
    version: 1,
    port: 443,
    groups: {},
    latency: { globalMs: 0 },
};

export { INITIAL_GLOBAL_CONFIG };
