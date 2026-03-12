import { describe, expect, it } from 'vitest';
import { getTrustCommand, getShellProfile, checkNodeTrust, checkPythonTrust, checkDenoTrust, checkOpensslTrust, isRuntimeInstalled } from './trust.js';

describe('trust module', () => {
    it('getTrustCommand returns command and args', () => {
        const result = getTrustCommand('/path/to/ca.crt');
        expect(result).toHaveProperty('command');
        expect(result).toHaveProperty('args');
        expect(typeof result.command).toBe('string');
        expect(Array.isArray(result.args)).toBe(true);
    });

    it('getTrustCommand includes cert path in args', () => {
        const certPath = '/path/to/proxy-dev-ca.crt';
        const result = getTrustCommand(certPath);
        const argsStr = result.args.join(' ');
        expect(argsStr).toContain(certPath);
    });

    it('getTrustCommand returns platform-appropriate command', () => {
        const result = getTrustCommand('/path/to/ca.crt');
        const argsStr = result.args.join(' ');
        if (process.platform === 'darwin') {
            expect(argsStr).toContain('security');
        } else if (process.platform === 'linux') {
            expect(argsStr).toContain('ca-certificates') ;
        } else if (process.platform === 'win32') {
            expect(result.command).toBe('certutil');
        }
    });

    it('getShellProfile returns a path based on SHELL env', () => {
        const profile = getShellProfile();
        expect(typeof profile).toBe('string');
        expect(profile.length).toBeGreaterThan(0);
        if (process.platform === 'win32') {
            expect(profile).toBe('system environment variables');
        } else {
            // Should end with a known profile filename
            const basename = profile.split('/').pop();
            expect(['.zshrc', '.bashrc', '.profile']).toContain(basename);
        }
    });

    it('check functions return booleans', () => {
        expect(typeof checkNodeTrust()).toBe('boolean');
        expect(typeof checkPythonTrust()).toBe('boolean');
        expect(typeof checkOpensslTrust()).toBe('boolean');
        expect(typeof checkDenoTrust()).toBe('boolean');
    });

    it('isRuntimeInstalled returns boolean', () => {
        // node is definitely installed since we're running in it
        expect(isRuntimeInstalled('node')).toBe(true);
        expect(isRuntimeInstalled('definitely-not-a-real-binary-xyz')).toBe(false);
    });
});
