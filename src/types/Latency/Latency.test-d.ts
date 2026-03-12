import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { LatencyConfig } from './index.js';

describe('Latency type tests', () => {
    it('LatencyConfig has globalMs', () => {
        expectTypeOf<LatencyConfig>().toHaveProperty('globalMs');
    });

    it('LatencyConfig is assignable', () => {
        assertType<LatencyConfig>({ globalMs: 200 });
    });
});
