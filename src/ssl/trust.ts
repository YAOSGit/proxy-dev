import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ── Shell profile helpers ──────────────────────────────────────────

const getShellProfile = (): string => {
	if (process.platform === 'win32') return 'system environment variables';
	const shell = process.env.SHELL ?? '';
	if (shell.endsWith('zsh')) return path.join(os.homedir(), '.zshrc');
	if (shell.endsWith('bash')) return path.join(os.homedir(), '.bashrc');
	return path.join(os.homedir(), '.profile');
};

const appendWindowsEnv = (exportLine: string): 'added' | 'exists' => {
	const match = exportLine.match(/^export\s+(\w+)="([^"]+)"/);
	if (!match) return 'added';
	const [, envVar, value] = match;
	// Check if already set
	if (
		process.env[envVar]?.includes('proxy-dev') ||
		process.env[envVar] === value
	) {
		return 'exists';
	}
	execFileSync('setx', [envVar, value], { stdio: 'pipe' });
	return 'added';
};

const appendToShellProfile = (exportLine: string): 'added' | 'exists' => {
	if (process.platform === 'win32') {
		return appendWindowsEnv(exportLine);
	}

	const profilePath = getShellProfile();
	const existing = fs.existsSync(profilePath)
		? fs.readFileSync(profilePath, 'utf-8')
		: '';

	// Check for proxy-dev marker + the env var name
	const envVar = exportLine.match(/^export\s+(\w+)/)?.[1];
	if (envVar && existing.includes(envVar) && existing.includes('proxy-dev')) {
		return 'exists';
	}

	fs.appendFileSync(profilePath, `\n${exportLine}\n`);
	return 'added';
};

const checkShellProfile = (envVar: string): boolean => {
	if (process.platform === 'win32') {
		return (process.env[envVar] ?? '').length > 0;
	}

	const profilePath = getShellProfile();
	if (!fs.existsSync(profilePath)) return false;
	const content = fs.readFileSync(profilePath, 'utf-8');
	return content.includes(envVar) && content.includes('proxy-dev');
};

// ── Runtime detection ──────────────────────────────────────────────

const isRuntimeInstalled = (binary: string): boolean => {
	try {
		const cmd = process.platform === 'win32' ? 'where' : 'which';
		execFileSync(cmd, [binary], { stdio: 'pipe' });
		return true;
	} catch {
		return false;
	}
};

// ── System trust ───────────────────────────────────────────────────

const getTrustCommand = (
	caCertPath: string,
): { command: string; args: string[] } => {
	switch (process.platform) {
		case 'darwin':
			return {
				command: 'sudo',
				args: [
					'security',
					'add-trusted-cert',
					'-d',
					'-r',
					'trustRoot',
					'-k',
					'/Library/Keychains/System.keychain',
					caCertPath,
				],
			};
		case 'linux': {
			if (fs.existsSync('/etc/pki/ca-trust/source/anchors')) {
				// RHEL, CentOS, Fedora
				return {
					command: 'sudo',
					args: [
						'bash',
						'-c',
						`cp "${caCertPath}" /etc/pki/ca-trust/source/anchors/proxy-dev-ca.crt && update-ca-trust`,
					],
				};
			}
			if (fs.existsSync('/etc/ca-certificates/trust-source/anchors')) {
				// Arch Linux
				return {
					command: 'sudo',
					args: [
						'bash',
						'-c',
						`cp "${caCertPath}" /etc/ca-certificates/trust-source/anchors/proxy-dev-ca.crt && trust extract-compat`,
					],
				};
			}
			// Default: Debian, Ubuntu, Alpine
			return {
				command: 'sudo',
				args: [
					'bash',
					'-c',
					`cp "${caCertPath}" /usr/local/share/ca-certificates/proxy-dev-ca.crt && update-ca-certificates`,
				],
			};
		}
		case 'win32':
			return {
				command: 'certutil',
				args: ['-addstore', '-f', 'ROOT', caCertPath],
			};
		default:
			throw new Error(
				`Unsupported platform: ${process.platform}. Please add "${caCertPath}" to your system trust store manually.`,
			);
	}
};

const checkTrustStatus = (caCertPath: string): boolean => {
	if (!fs.existsSync(caCertPath)) return false;

	try {
		switch (process.platform) {
			case 'darwin': {
				execFileSync('security', ['verify-cert', '-c', caCertPath], {
					stdio: ['pipe', 'pipe', 'pipe'],
				});
				return true;
			}
			case 'linux': {
				execFileSync(
					'openssl',
					['verify', '-CApath', '/etc/ssl/certs', caCertPath],
					{
						stdio: ['pipe', 'pipe', 'pipe'],
					},
				);
				return true;
			}
			case 'win32': {
				execFileSync('certutil', ['-verify', caCertPath], {
					stdio: ['pipe', 'pipe', 'pipe'],
				});
				return true;
			}
			default:
				return false;
		}
	} catch {
		return false;
	}
};

// ── Firefox trust ──────────────────────────────────────────────────

const getFirefoxProfilesDir = (): string => {
	switch (process.platform) {
		case 'darwin':
			return path.join(
				os.homedir(),
				'Library/Application Support/Firefox/Profiles',
			);
		case 'win32':
			return path.join(
				process.env.APPDATA ?? os.homedir(),
				'Mozilla/Firefox/Profiles',
			);
		default: // linux
			return path.join(os.homedir(), '.mozilla/firefox');
	}
};

const checkFirefoxTrust = (): boolean => {
	const profilesDir = getFirefoxProfilesDir();
	if (!fs.existsSync(profilesDir)) return false;

	const profiles = fs.readdirSync(profilesDir);
	const line = 'user_pref("security.enterprise_roots.enabled", true);';

	return profiles.some((profile) => {
		const userJsPath = path.join(profilesDir, profile, 'user.js');
		if (!fs.existsSync(userJsPath)) return false;
		return fs.readFileSync(userJsPath, 'utf-8').includes(line);
	});
};

// ── System CA bundle ──────────────────────────────────────────────

const SYSTEM_CA_PATHS = [
	'/etc/ssl/cert.pem', // macOS
	'/etc/ssl/certs/ca-certificates.crt', // Debian, Ubuntu, Arch, Alpine
	'/etc/pki/tls/certs/ca-bundle.crt', // RHEL, CentOS, Fedora
	'/etc/ssl/ca-bundle.pem', // openSUSE
	'/etc/ca-certificates/extracted/tls-ca-bundle.pem', // Arch variant
];

const getSystemCAsPath = (): string | null => {
	if (process.platform === 'win32') return null;
	return SYSTEM_CA_PATHS.find((p) => fs.existsSync(p)) ?? null;
};

// ── Node.js trust ──────────────────────────────────────────────────

const trustNode = (caCertPath: string): 'added' | 'exists' => {
	return appendToShellProfile(
		`export NODE_EXTRA_CA_CERTS="${caCertPath}" # proxy-dev`,
	);
};

const checkNodeTrust = (): boolean => checkShellProfile('NODE_EXTRA_CA_CERTS');

// ── Python trust ───────────────────────────────────────────────────

const trustPython = (
	caCertPath: string,
	certsDir: string,
): 'added' | 'exists' => {
	// Generate combined CA bundle (system CAs + proxy CA)
	const systemCAsPath = getSystemCAsPath();
	const combinedPath = path.join(certsDir, 'combined-ca.pem');
	if (systemCAsPath) {
		const systemCAs = fs.readFileSync(systemCAsPath, 'utf-8');
		const proxyCA = fs.readFileSync(caCertPath, 'utf-8');
		fs.writeFileSync(combinedPath, `${systemCAs}\n${proxyCA}\n`, 'utf-8');
	} else {
		// Windows or unknown: bundle proxy CA only (system CAs handled by OS)
		const proxyCA = fs.readFileSync(caCertPath, 'utf-8');
		fs.writeFileSync(combinedPath, proxyCA, 'utf-8');
	}

	return appendToShellProfile(
		`export REQUESTS_CA_BUNDLE="${combinedPath}" # proxy-dev`,
	);
};

const checkPythonTrust = (): boolean => checkShellProfile('REQUESTS_CA_BUNDLE');

// ── Java trust ─────────────────────────────────────────────────────

const checkJavaTrust = (): boolean => {
	try {
		execFileSync(
			'keytool',
			['-list', '-alias', 'proxy-dev', '-cacerts', '-storepass', 'changeit'],
			{
				stdio: 'pipe',
			},
		);
		return true;
	} catch {
		return false;
	}
};

const trustJava = (caCertPath: string): void => {
	const keytoolArgs = [
		'-importcert',
		'-alias',
		'proxy-dev',
		'-file',
		caCertPath,
		'-cacerts',
		'-noprompt',
		'-storepass',
		'changeit',
	];

	if (process.platform === 'win32') {
		// Must be run from an elevated terminal on Windows
		execFileSync('keytool', keytoolArgs, { stdio: 'inherit' });
	} else {
		execFileSync('sudo', ['keytool', ...keytoolArgs], { stdio: 'inherit' });
	}
};

// ── OpenSSL / generic trust (Ruby, Go, Rust, PHP) ─────────────────

const trustOpenssl = (
	caCertPath: string,
	certsDir: string,
): 'added' | 'exists' => {
	// Generate combined CA bundle (system CAs + proxy CA) — reuses same file as Python
	const systemCAsPath = getSystemCAsPath();
	const combinedPath = path.join(certsDir, 'combined-ca.pem');
	if (systemCAsPath) {
		const systemCAs = fs.readFileSync(systemCAsPath, 'utf-8');
		const proxyCA = fs.readFileSync(caCertPath, 'utf-8');
		fs.writeFileSync(combinedPath, `${systemCAs}\n${proxyCA}\n`, 'utf-8');
	} else {
		// Windows or unknown: bundle proxy CA only (system CAs handled by OS)
		const proxyCA = fs.readFileSync(caCertPath, 'utf-8');
		fs.writeFileSync(combinedPath, proxyCA, 'utf-8');
	}

	return appendToShellProfile(
		`export SSL_CERT_FILE="${combinedPath}" # proxy-dev`,
	);
};

const checkOpensslTrust = (): boolean => checkShellProfile('SSL_CERT_FILE');

// ── Deno trust ─────────────────────────────────────────────────────

const trustDeno = (caCertPath: string): 'added' | 'exists' => {
	return appendToShellProfile(`export DENO_CERT="${caCertPath}" # proxy-dev`);
};

const checkDenoTrust = (): boolean => checkShellProfile('DENO_CERT');

// ── Exports ────────────────────────────────────────────────────────

export {
	getShellProfile,
	getFirefoxProfilesDir,
	getTrustCommand,
	checkTrustStatus,
	checkFirefoxTrust,
	trustNode,
	checkNodeTrust,
	trustPython,
	checkPythonTrust,
	trustJava,
	checkJavaTrust,
	trustOpenssl,
	checkOpensslTrust,
	trustDeno,
	checkDenoTrust,
	isRuntimeInstalled,
};
