import { assertType, describe, expectTypeOf, it } from 'vitest';
import type { CertPaths, CACert } from './index.js';

describe('Certificate type tests', () => {
    it('CertPaths has key and cert', () => {
        expectTypeOf<CertPaths>().toHaveProperty('key');
        expectTypeOf<CertPaths>().toHaveProperty('cert');
    });

    it('CACert has keyPath and certPath', () => {
        expectTypeOf<CACert>().toHaveProperty('keyPath');
        expectTypeOf<CACert>().toHaveProperty('certPath');
    });

    it('CertPaths is assignable', () => {
        assertType<CertPaths>({ key: '/path/to/key', cert: '/path/to/cert' });
    });
});
