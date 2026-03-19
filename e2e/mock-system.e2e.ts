// NOTE: This is an integration test — it exercises internal snapshot APIs
// (writeMockFile, readMockFile, addMockToLocalConfig, etc.) rather than
// invoking the CLI binary. For CLI-level mock tests see mock.e2e.ts.
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	addMockToLocalConfig,
	buildMockFilePath,
	defaultVariantName,
	readMockFile,
	writeMockFile,
} from '../src/utils/snapshot/index.js';
import { createTempDir } from './utils/index.js';

describe('mock system E2E (integration)', () => {
	let tmpDir: string;
	let cleanup: () => void;

	beforeEach(() => {
		const tmp = createTempDir();
		tmpDir = tmp.dir;
		cleanup = tmp.cleanup;
	});

	afterEach(() => {
		cleanup();
	});

	it('full snapshot flow: write, read, add to config', () => {
		// Build file path
		const filePath = path.join(
			tmpDir,
			...buildMockFilePath('api.local', '/users', 'success').split('/'),
		);
		const _fullPath = path.isAbsolute(filePath)
			? filePath
			: path.join(tmpDir, filePath);

		const mockFilePath = path.join(
			tmpDir,
			'mocks',
			'api.local',
			'users',
			'success.json',
		);

		// Write mock
		writeMockFile(mockFilePath, '{"users":[{"id":1,"name":"Alice"}]}', 200, {
			'Content-Type': 'application/json',
		});
		expect(fs.existsSync(mockFilePath)).toBe(true);

		// Read mock back
		const { body, status } = readMockFile(mockFilePath);
		expect(status).toBe(200);
		expect(JSON.parse(body)).toHaveProperty('users');

		// Add to local config
		const configPath = path.join(tmpDir, 'proxy-dev.json');
		addMockToLocalConfig(configPath, 'api.local/users', 'success', {
			file: mockFilePath,
			status: 200,
		});

		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		expect(config.mocks['api.local/users'].variants.success).toBeDefined();
	});

	it('defaultVariantName uses correct naming', () => {
		expect(defaultVariantName(200)).toBe('success');
		expect(defaultVariantName(201)).toBe('success');
		expect(defaultVariantName(500)).toBe('error-500');
		expect(defaultVariantName(404)).toBe('error-404');
	});

	it('multiple variants can coexist', () => {
		const configPath = path.join(tmpDir, 'proxy-dev.json');

		addMockToLocalConfig(configPath, 'api.local/users', 'success', {
			file: './mocks/api.local/users/success.json',
			status: 200,
		});
		addMockToLocalConfig(configPath, 'api.local/users', 'error-500', {
			file: './mocks/api.local/users/error-500.json',
			status: 500,
		});

		const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
		const variants = config.mocks['api.local/users'].variants;
		expect(Object.keys(variants)).toHaveLength(2);
		expect(variants.success.status).toBe(200);
		expect(variants['error-500'].status).toBe(500);
	});
});
