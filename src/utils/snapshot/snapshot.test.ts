import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
	addMockToLocalConfig,
	buildMockFilePath,
	defaultVariantName,
	readMockFile,
	writeMockFile,
} from './index.js';

describe('snapshot utilities', () => {
	let tmpDir: string;

	beforeEach(() => {
		tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proxy-dev-snap-'));
	});

	afterEach(() => {
		fs.rmSync(tmpDir, { recursive: true, force: true });
	});

	describe('buildMockFilePath', () => {
		it('builds path for root path', () => {
			const p = buildMockFilePath('api.local', '/', 'success');
			expect(p).toContain('mocks');
			expect(p).toContain('api.local');
			expect(p).toContain('success.json');
		});

		it('builds path with nested path segments', () => {
			const p = buildMockFilePath('api.local', '/users/123', 'success');
			expect(p).toContain('users');
			expect(p).toContain('123');
			expect(p).toContain('success.json');
		});
	});

	describe('defaultVariantName', () => {
		it('returns success for 200', () => {
			expect(defaultVariantName(200)).toBe('success');
		});

		it('returns success for 201', () => {
			expect(defaultVariantName(201)).toBe('success');
		});

		it('returns error-500 for 500', () => {
			expect(defaultVariantName(500)).toBe('error-500');
		});

		it('returns error-404 for 404', () => {
			expect(defaultVariantName(404)).toBe('error-404');
		});
	});

	describe('writeMockFile and readMockFile', () => {
		it('writes JSON body with _mock metadata', () => {
			const filePath = path.join(tmpDir, 'test.json');
			writeMockFile(filePath, '{"users":[]}', 200, {
				'Content-Type': 'application/json',
			});
			const content = fs.readFileSync(filePath, 'utf-8');
			const parsed = JSON.parse(content);
			expect(parsed._mock).toBeDefined();
			expect(parsed._mock.status).toBe(200);
			expect(parsed.users).toEqual([]);
		});

		it('readMockFile extracts body and status', () => {
			const filePath = path.join(tmpDir, 'test.json');
			writeMockFile(filePath, '{"users":[{"id":1}]}', 200);
			const result = readMockFile(filePath);
			expect(result.status).toBe(200);
			expect(JSON.parse(result.body)).toEqual({ users: [{ id: 1 }] });
		});

		it('handles non-JSON body as raw', () => {
			const filePath = path.join(tmpDir, 'test.txt');
			writeMockFile(filePath, 'plain text', 200);
			const result = readMockFile(filePath);
			expect(result.body).toBe('plain text');
		});
	});

	describe('addMockToLocalConfig', () => {
		it('creates new config file with mock entry', () => {
			const configPath = path.join(tmpDir, 'proxy-dev.json');
			addMockToLocalConfig(configPath, 'api.local/users', 'success', {
				file: './mocks/api.local/users/success.json',
				status: 200,
			});
			const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
			expect(config.mocks['api.local/users']).toBeDefined();
			expect(config.mocks['api.local/users'].variants.success.status).toBe(200);
		});

		it('updates existing config', () => {
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
			expect(
				Object.keys(config.mocks['api.local/users'].variants),
			).toHaveLength(2);
		});
	});
});
