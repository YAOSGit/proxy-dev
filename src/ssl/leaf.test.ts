import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { generateCA } from './ca.js';
import { generateLeaf } from './leaf.js';

describe('leaf certificate generation', () => {
	let tmpDir: string;
	let certsDir: string;
	let leavesDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-leaf-'));
		certsDir = path.join(tmpDir, 'certs');
		leavesDir = path.join(certsDir, 'leaves');
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	it('generates leaf key and cert files', () => {
		const ca = generateCA(certsDir);
		const { key, cert } = generateLeaf('api.local', ca, leavesDir);
		expect(fs.existsSync(key)).toBe(true);
		expect(fs.existsSync(cert)).toBe(true);
	});

	it('generated leaf cert is PEM format', () => {
		const ca = generateCA(certsDir);
		const { cert } = generateLeaf('api.local', ca, leavesDir);
		const pem = fs.readFileSync(cert, 'utf-8');
		expect(pem).toContain('-----BEGIN CERTIFICATE-----');
	});

	it('does not regenerate if cert exists and is valid', () => {
		const ca = generateCA(certsDir);
		const first = generateLeaf('api.local', ca, leavesDir);
		const firstMtime = fs.statSync(first.cert).mtimeMs;
		const second = generateLeaf('api.local', ca, leavesDir);
		const secondMtime = fs.statSync(second.cert).mtimeMs;
		expect(secondMtime).toBe(firstMtime);
	});
});
