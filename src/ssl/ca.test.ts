import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateCA, loadCA } from './ca.js';

describe('CA generation', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-ca-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('generates CA key and cert files', () => {
        const { keyPath, certPath } = generateCA(tmpDir);
        expect(fs.existsSync(keyPath)).toBe(true);
        expect(fs.existsSync(certPath)).toBe(true);
    });

    it('generated cert is PEM format', () => {
        const { certPath } = generateCA(tmpDir);
        const pem = fs.readFileSync(certPath, 'utf-8');
        expect(pem).toContain('-----BEGIN CERTIFICATE-----');
    });

    it('loadCA returns existing CA without regenerating', () => {
        generateCA(tmpDir);
        const ca = loadCA(tmpDir);
        expect(ca).not.toBeNull();
    });

    it('loadCA returns null if no CA exists', () => {
        const ca = loadCA(tmpDir);
        expect(ca).toBeNull();
    });
});
