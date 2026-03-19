import fs from 'node:fs';
import path from 'node:path';
import { atomicWrite } from '@yaos-git/toolkit/cli';
import type { LocalConfig } from '../../types/Config/index.js';
import type { MockVariant } from '../../types/Mock/index.js';

const MOCKS_DIR = 'mocks';
const MAX_SNAPSHOT_BYTES = 10 * 1024 * 1024; // 10 MB

const buildMockFilePath = (
	domain: string,
	urlPath: string,
	variantName: string,
): string => {
	const pathSegments = urlPath
		.split('/')
		.filter((s) => s !== '' && s !== '..' && s !== '.');
	const filePath = path.join(
		MOCKS_DIR,
		domain,
		...pathSegments,
		`${variantName}.json`,
	);
	const absBase = path.resolve(MOCKS_DIR);
	const absFile = path.resolve(filePath);
	if (!absFile.startsWith(absBase + path.sep) && absFile !== absBase) {
		throw new Error('Path traversal detected in mock file path');
	}
	return filePath;
};

const defaultVariantName = (statusCode: number): string => {
	if (statusCode >= 200 && statusCode < 300) return 'success';
	return `error-${statusCode}`;
};

type MockFileMeta = {
	status: number;
	headers?: Record<string, string>;
};

const writeMockFile = (
	filePath: string,
	body: string,
	status: number,
	headers?: Record<string, string>,
): void => {
	if (Buffer.byteLength(body, 'utf-8') > MAX_SNAPSHOT_BYTES) {
		throw new Error(
			`Response body exceeds ${MAX_SNAPSHOT_BYTES / 1024 / 1024}MB snapshot limit`,
		);
	}
	const dir = path.dirname(filePath);
	fs.mkdirSync(dir, { recursive: true });

	let content: string;
	try {
		const parsed = JSON.parse(body) as unknown;
		const mockMeta: MockFileMeta = { status };
		if (headers) mockMeta.headers = headers;
		const output = { _mock: mockMeta, ...(parsed as object) };
		content = JSON.stringify(output, null, '\t');
	} catch {
		// Non-JSON body — write raw file
		content = body;
	}

	atomicWrite(filePath, content);
};

type MockFileContent = {
	body: string;
	status: number;
	headers?: Record<string, string>;
};

const readMockFile = (filePath: string): MockFileContent => {
	const content = fs.readFileSync(filePath, 'utf-8');
	try {
		const parsed = JSON.parse(content) as Record<string, unknown>;
		if ('_mock' in parsed) {
			const { _mock, ...rest } = parsed;
			const meta = _mock as MockFileMeta;
			return {
				body: JSON.stringify(rest),
				status: meta.status,
				headers: meta.headers,
			};
		}
		return { body: content, status: 200 };
	} catch {
		return { body: content, status: 200 };
	}
};

const addMockToLocalConfig = (
	configPath: string,
	routeKey: string,
	variantName: string,
	variant: MockVariant,
): void => {
	let config: LocalConfig = { mocks: {} };
	if (fs.existsSync(configPath)) {
		try {
			config = JSON.parse(fs.readFileSync(configPath, 'utf-8')) as LocalConfig;
		} catch {
			config = { mocks: {} };
		}
	}

	if (!config.mocks) config.mocks = {};
	if (!config.mocks[routeKey]) {
		config.mocks[routeKey] = { variants: {} };
	}
	const mockRoute = config.mocks[routeKey];
	if (mockRoute) mockRoute.variants[variantName] = variant;

	atomicWrite(configPath, JSON.stringify(config, null, '\t'));
};

export {
	buildMockFilePath,
	defaultVariantName,
	writeMockFile,
	readMockFile,
	addMockToLocalConfig,
};
