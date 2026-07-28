#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createCLI,
	fatalError,
	formatError,
	getExitCode,
	runIfMain,
} from '@yaos-git/toolkit/cli';
import { Option } from 'commander';
import {
	checkDenoTrust,
	checkFirefoxTrust,
	checkJavaTrust,
	checkNodeTrust,
	checkOpensslTrust,
	checkPythonTrust,
	checkTrustStatus,
	generateCA,
	getFirefoxProfilesDir,
	getShellProfile,
	getTrustCommand,
	isRuntimeInstalled,
	loadCA,
	trustDeno,
	trustJava,
	trustNode,
	trustOpenssl,
	trustPython,
} from '../ssl/index.js';
import {
	bootstrapGlobalConfig,
	loadGlobalConfig,
	loadLocalConfig,
	resolveRoutes,
	saveGlobalConfig,
	saveLocalConfig,
} from '../utils/config/index.js';
import { getCertsDir, getPidPath } from '../utils/platform/index.js';

declare const __CLI_VERSION__: string;

export async function runCLI(
	args: string[] = process.argv.slice(2),
): Promise<void> {
	const { program } = createCLI({
		name: 'proxy-dev',
		description: 'Local-first reverse proxy and interceptor',
		version: __CLI_VERSION__,
	});

	// trust subcommand group
	const trustCmd = program
		.command('trust')
		.description('Manage CA trust for system and runtimes');

	trustCmd
		.command('init')
		.description('Generate CA certificate and bootstrap global config')
		.action(() => {
			bootstrapGlobalConfig();
			const certsDir = getCertsDir();
			generateCA(certsDir);
			console.log('✓ Global config created at ~/.config/proxy-dev/config.json');
			console.log('✓ CA certificate generated at ~/.config/proxy-dev/certs/');
			console.log('  Run: proxy-dev trust system');
			return;
		});

	trustCmd
		.command('system')
		.description('Add CA to OS trust store (browsers, curl, etc.)')
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.error('No CA found. Run proxy-dev trust init first.');
				process.exitCode = 1;
				return;
			}
			const { command, args } = getTrustCommand(ca.certPath);
			console.log(`Running: ${command} ${args.join(' ')}`);
			try {
				execFileSync(command, args, { stdio: 'inherit' });
				console.log('✓ CA trusted in system keychain');
				console.log('  Run: proxy-dev trust status');
			} catch {
				console.error(
					'Failed to trust CA. You may need to provide sudo password.',
				);
				process.exitCode = 1;
				return;
			}
			return;
		});

	trustCmd
		.command('firefox')
		.description('Enable enterprise roots in Firefox profiles')
		.action(() => {
			const profilesDir = getFirefoxProfilesDir();
			if (!fs.existsSync(profilesDir)) {
				console.error('Firefox profiles directory not found.');
				process.exitCode = 1;
				return;
			}

			const profiles = fs.readdirSync(profilesDir);
			let count = 0;
			for (const profile of profiles) {
				const userJsPath = path.join(profilesDir, profile, 'user.js');
				const line = 'user_pref("security.enterprise_roots.enabled", true);';

				let content = '';
				if (fs.existsSync(userJsPath)) {
					content = fs.readFileSync(userJsPath, 'utf-8');
					if (content.includes(line)) continue;
					content += `\n${line}\n`;
				} else {
					content = `${line}\n`;
				}

				fs.writeFileSync(userJsPath, content);
				console.log(`✓ Updated Firefox profile: ${profile}`);
				count++;
			}

			if (count > 0) {
				console.log(
					`\nUpdated ${count} Firefox profile(s). Restart Firefox for changes to take effect.`,
				);
			} else {
				console.log('All Firefox profiles already configured.');
			}
			return;
		});

	trustCmd
		.command('node')
		.description('Configure Node.js to trust the CA (NODE_EXTRA_CA_CERTS)')
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.error('No CA found. Run proxy-dev trust init first.');
				process.exitCode = 1;
				return;
			}
			const result = trustNode(ca.certPath);
			const profileName = path.basename(getShellProfile());
			if (result === 'exists') {
				console.log(`✓ NODE_EXTRA_CA_CERTS already in ~/${profileName}`);
			} else {
				console.log(`✓ Added NODE_EXTRA_CA_CERTS to ~/${profileName}`);
				console.log(`  Run: source ~/${profileName}  (or open a new terminal)`);
			}
			return;
		});

	trustCmd
		.command('python')
		.description(
			'Configure Python requests/certifi to trust the CA (REQUESTS_CA_BUNDLE)',
		)
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.error('No CA found. Run proxy-dev trust init first.');
				process.exitCode = 1;
				return;
			}
			try {
				const result = trustPython(ca.certPath, certsDir);
				const profileName = path.basename(getShellProfile());
				if (result === 'exists') {
					console.log(`✓ REQUESTS_CA_BUNDLE already in ~/${profileName}`);
				} else {
					console.log(
						'✓ Generated combined CA bundle at ~/.config/proxy-dev/certs/combined-ca.pem',
					);
					console.log(`✓ Added REQUESTS_CA_BUNDLE to ~/${profileName}`);
					console.log(
						`  Run: source ~/${profileName}  (or open a new terminal)`,
					);
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(`Failed to configure Python trust: ${msg}`);
				process.exitCode = 1;
				return;
			}
			return;
		});

	trustCmd
		.command('java')
		.description('Import CA into JVM keystore (keytool)')
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.error('No CA found. Run proxy-dev trust init first.');
				process.exitCode = 1;
				return;
			}
			if (checkJavaTrust()) {
				console.log('✓ CA already in JVM keystore (alias: proxy-dev)');
				return;
			}
			try {
				trustJava(ca.certPath);
				console.log('✓ CA imported into JVM keystore (alias: proxy-dev)');
			} catch {
				console.error(
					'Failed to import CA. Ensure keytool is on your PATH and provide sudo password.',
				);
				process.exitCode = 1;
				return;
			}
			return;
		});

	trustCmd
		.command('deno')
		.description('Configure Deno to trust the CA (DENO_CERT)')
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.error('No CA found. Run proxy-dev trust init first.');
				process.exitCode = 1;
				return;
			}
			const result = trustDeno(ca.certPath);
			const profileName = path.basename(getShellProfile());
			if (result === 'exists') {
				console.log(`✓ DENO_CERT already in ~/${profileName}`);
			} else {
				console.log(`✓ Added DENO_CERT to ~/${profileName}`);
				console.log(`  Run: source ~/${profileName}  (or open a new terminal)`);
			}
			return;
		});

	trustCmd
		.command('openssl')
		.description(
			'Configure SSL_CERT_FILE for OpenSSL-based runtimes (Ruby, Go, Rust, PHP)',
		)
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.error('No CA found. Run proxy-dev trust init first.');
				process.exitCode = 1;
				return;
			}
			try {
				const result = trustOpenssl(ca.certPath, certsDir);
				const profileName = path.basename(getShellProfile());
				if (result === 'exists') {
					console.log(`✓ SSL_CERT_FILE already in ~/${profileName}`);
				} else {
					console.log(
						'✓ Generated combined CA bundle at ~/.config/proxy-dev/certs/combined-ca.pem',
					);
					console.log(`✓ Added SSL_CERT_FILE to ~/${profileName}`);
					console.log(
						`  Run: source ~/${profileName}  (or open a new terminal)`,
					);
				}
			} catch (err) {
				const msg = err instanceof Error ? err.message : String(err);
				console.error(`Failed to configure OpenSSL trust: ${msg}`);
				process.exitCode = 1;
				return;
			}
			return;
		});

	trustCmd
		.command('status')
		.description('Show trust status for system and runtimes')
		.action(() => {
			const certsDir = getCertsDir();
			const ca = loadCA(certsDir);
			if (!ca) {
				console.log('No CA found. Run: proxy-dev trust init');
				process.exitCode = 1;
				return;
			}

			const ok = (msg: string) => `  \x1b[32m✓\x1b[0m ${msg}`;
			const no = (msg: string) => `  \x1b[31m✗\x1b[0m ${msg}`;
			const skip = (msg: string) => `  \x1b[90m–\x1b[0m ${msg}`;

			console.log('');
			console.log(
				checkTrustStatus(ca.certPath)
					? ok('System keychain')
					: no('System keychain'),
			);
			console.log(checkFirefoxTrust() ? ok('Firefox') : no('Firefox'));
			console.log(
				isRuntimeInstalled('node')
					? checkNodeTrust()
						? ok('Node.js')
						: no('Node.js')
					: skip('Node.js (not installed)'),
			);
			console.log(
				isRuntimeInstalled('python3') || isRuntimeInstalled('python')
					? checkPythonTrust()
						? ok('Python')
						: no('Python')
					: skip('Python (not installed)'),
			);
			console.log(
				isRuntimeInstalled('java')
					? checkJavaTrust()
						? ok('Java')
						: no('Java')
					: skip('Java (not installed)'),
			);
			console.log(
				checkOpensslTrust()
					? ok('OpenSSL (Ruby, Go, Rust, PHP)')
					: no('OpenSSL (Ruby, Go, Rust, PHP)'),
			);
			console.log(
				isRuntimeInstalled('deno')
					? checkDenoTrust()
						? ok('Deno')
						: no('Deno')
					: skip('Deno (not installed)'),
			);
			console.log('');
			return;
		});

	// start command (headless — logs traffic to stdout)
	program
		.command('start')
		.option('-c, --config <path>', 'Config file path')
		.addOption(
			new Option('--mode <mode>', 'Config mode: local, global, or merged')
				.default('merged')
				.choices(['local', 'global', 'merged']),
		)
		.action(async (opts: { config?: string; mode?: string }) => {
			const { setup } = await import('./setup.js');
			const { runHeadless } = await import('./headless.js');
			const { resolved, certs } = await setup(opts);
			await runHeadless(resolved, certs);
			return;
		});

	// stop command
	program.command('stop').action(() => {
		const pidPath = getPidPath();
		if (!fs.existsSync(pidPath)) {
			console.log('No proxy-dev instance found.');
			return;
		}
		const pid = parseInt(fs.readFileSync(pidPath, 'utf-8').trim(), 10);
		if (Number.isNaN(pid) || pid <= 0) {
			console.error('PID file contains invalid value. Removing stale file.');
			fs.unlinkSync(pidPath);
			process.exitCode = 1;
			return;
		}
		try {
			process.kill(pid, 'SIGTERM');
			console.log(`Sent SIGTERM to proxy-dev (PID ${pid})`);
		} catch {
			console.error(`Failed to stop proxy-dev (PID ${pid})`);
		}
		fs.unlinkSync(pidPath);
	});

	// daemon command group
	const daemonCmd = program
		.command('daemon')
		.description('Manage the hosts daemon');

	daemonCmd
		.command('start')
		.description(
			'Start the hosts daemon (the one sudo step; the proxy then starts without it)',
		)
		.action(async () => {
			const { ensureHostsDaemon } = await import('./setup.js');
			const ok = await ensureHostsDaemon();
			process.exitCode = ok ? 0 : 1;
			return;
		});

	daemonCmd
		.command('status')
		.description('Check if daemon is running')
		.action(async () => {
			const { isDaemonRunning } = await import('../daemon/index.js');
			const { getDaemonSocketPath } = await import(
				'../utils/platform/index.js'
			);
			const running = await isDaemonRunning(getDaemonSocketPath());
			console.log(running ? 'Daemon is running.' : 'Daemon is not running.');
			process.exitCode = running ? 0 : 1;
			return;
		});

	daemonCmd
		.command('stop')
		.description('Stop the hosts daemon')
		.action(async () => {
			const { DaemonClient, isDaemonRunning } = await import(
				'../daemon/index.js'
			);
			const { getDaemonSocketPath } = await import(
				'../utils/platform/index.js'
			);
			const socketPath = getDaemonSocketPath();
			if (!(await isDaemonRunning(socketPath))) {
				console.log('Daemon is not running.');
				return;
			}
			const client = new DaemonClient(socketPath);
			await client.shutdown();
			console.log('Daemon stopped.');
		});

	daemonCmd
		.command('install')
		.description(
			'Install daemon as a root system service — launchd (macOS) / systemd (Linux); restarts on crash, runs at boot',
		)
		.action(async () => {
			const { generatePlist, generateUnit, LABEL, SERVICE_NAME, DaemonClient, isDaemonRunning } =
				await import('../daemon/index.js');
			const {
				getLaunchdPlistPath,
				getSystemdUnitPath,
				getDaemonSocketPath,
				getServiceDaemonDir,
			} = await import('../utils/platform/index.js');

			if (process.platform !== 'darwin' && process.platform !== 'linux') {
				console.error(`daemon install is not supported on ${process.platform}.`);
				process.exitCode = 1;
				return;
			}

			const __dirname = path.dirname(fileURLToPath(import.meta.url));
			const sourceDaemonPath = path.resolve(__dirname, 'daemon.js');
			const socketPath = getDaemonSocketPath();

			console.log('Installing the daemon as a root system service (sudo)...');
			try {
				execFileSync('sudo', ['-v'], { stdio: 'inherit' });
			} catch {
				console.error('\n  Authentication failed or was cancelled.');
				process.exitCode = 1;
				return;
			}

			// Copy the (self-contained) daemon bundle to a system path. A service must not
			// execute from the install location: user paths churn, and macOS TCC denies even
			// root access to Desktop/Documents (EPERM crash-loop).
			const serviceDir = getServiceDaemonDir();
			const daemonPath = path.join(serviceDir, 'daemon.js');
			execFileSync('sudo', ['mkdir', '-p', serviceDir], { stdio: 'inherit' });
			execFileSync(
				'sudo',
				['install', '-o', 'root', '-m', '755', sourceDaemonPath, daemonPath],
				{ stdio: 'inherit' },
			);

			// Hand the socket over: an ad-hoc daemon (from `daemon start`) would hold it.
			if (await isDaemonRunning(socketPath)) {
				await new DaemonClient(socketPath).shutdown().catch(() => {});
			}

			const os = await import('node:os');
			const tmpFile = path.join(os.tmpdir(), `proxy-dev-service-${process.pid}`);

			if (process.platform === 'darwin') {
				const plistPath = getLaunchdPlistPath();
				fs.writeFileSync(tmpFile, generatePlist(process.execPath, daemonPath, socketPath));
				try {
					execFileSync(
						'sudo',
						['install', '-o', 'root', '-g', 'wheel', '-m', '644', tmpFile, plistPath],
						{ stdio: 'inherit' },
					);
					try {
						execFileSync('sudo', ['launchctl', 'bootout', `system/${LABEL}`], {
							stdio: 'ignore',
						});
					} catch {
						/* not previously loaded */
					}
					execFileSync('sudo', ['launchctl', 'bootstrap', 'system', plistPath], {
						stdio: 'inherit',
					});
					console.log(`  LaunchDaemon installed (${plistPath}) and started.`);
					console.log('  It now survives crashes and reboots — `daemon start` is no longer needed.');
				} finally {
					fs.rmSync(tmpFile, { force: true });
				}
				return;
			}

			// linux
			const unitPath = getSystemdUnitPath();
			fs.writeFileSync(tmpFile, generateUnit(process.execPath, daemonPath, socketPath));
			try {
				execFileSync(
					'sudo',
					['install', '-o', 'root', '-g', 'root', '-m', '644', tmpFile, unitPath],
					{ stdio: 'inherit' },
				);
				execFileSync('sudo', ['systemctl', 'daemon-reload'], { stdio: 'inherit' });
				execFileSync('sudo', ['systemctl', 'enable', '--now', SERVICE_NAME], {
					stdio: 'inherit',
				});
				console.log(`  systemd unit installed (${unitPath}) and started.`);
				console.log('  It now survives crashes and reboots — `daemon start` is no longer needed.');
			} finally {
				fs.rmSync(tmpFile, { force: true });
			}
		});

	daemonCmd
		.command('uninstall')
		.description('Remove daemon system service — launchd (macOS) / systemd (Linux)')
		.action(async () => {
			const { LABEL, SERVICE_NAME } = await import('../daemon/index.js');
			const { getLaunchdPlistPath, getSystemdUnitPath, getServiceDaemonDir } =
				await import('../utils/platform/index.js');

			if (process.platform === 'darwin') {
				const plistPath = getLaunchdPlistPath();
				try {
					execFileSync('sudo', ['launchctl', 'bootout', `system/${LABEL}`], {
						stdio: 'inherit',
					});
				} catch {
					/* may not be loaded */
				}
				try {
					execFileSync('sudo', ['rm', '-f', plistPath], { stdio: 'inherit' });
					execFileSync('sudo', ['rm', '-rf', getServiceDaemonDir()], {
						stdio: 'inherit',
					});
				} catch {
					/* may not exist */
				}
				console.log('Daemon service uninstalled.');
				return;
			}

			if (process.platform === 'linux') {
				const unitPath = getSystemdUnitPath();
				try {
					execFileSync('sudo', ['systemctl', 'disable', '--now', SERVICE_NAME], {
						stdio: 'inherit',
					});
				} catch {
					/* may not be enabled */
				}
				try {
					execFileSync('sudo', ['rm', '-f', unitPath], { stdio: 'inherit' });
					execFileSync('sudo', ['rm', '-rf', getServiceDaemonDir()], {
						stdio: 'inherit',
					});
					execFileSync('sudo', ['systemctl', 'daemon-reload'], { stdio: 'inherit' });
				} catch {
					/* may not exist */
				}
				console.log('Daemon service uninstalled.');
				return;
			}

			console.error(`daemon uninstall is not supported on ${process.platform}.`);
			process.exitCode = 1;
		});

	// routes command
	const routesCmd = program.command('routes').description('Manage routes');

	routesCmd
		.command('list')
		.description('List all routes')
		.action(() => {
			const global = loadGlobalConfig();
			const local = loadLocalConfig();
			const routes = resolveRoutes(global, local);
			if (routes.length === 0) {
				console.log('No routes configured.');
			} else {
				for (const route of routes) {
					const path = route.path ?? '/';
					console.log(`  ${route.domain}${path} → localhost:${route.target}`);
				}
			}
		});

	routesCmd
		.command('add <domain> <port>')
		.description('Add a route')
		.option('-g, --group <name>', 'Group name', 'default')
		.option('-p, --path <path>', 'Path prefix')
		.action(
			(
				domain: string,
				port: string,
				opts: { group: string; path?: string },
			) => {
				const global = loadGlobalConfig();
				if (!global.groups[opts.group]) {
					global.groups[opts.group] = { routes: [] };
				}
				const group = global.groups[opts.group];
				if (!group) return;
				group.routes.push({
					domain,
					target: parseInt(port, 10),
					...(opts.path ? { path: opts.path } : {}),
				});
				saveGlobalConfig(global);
				console.log(`✓ Added route: ${domain} → localhost:${port}`);
			},
		);

	routesCmd
		.command('remove <domain>')
		.description('Remove a route')
		.option('-g, --group <name>', 'Group name')
		.action((domain: string, opts: { group?: string }) => {
			const global = loadGlobalConfig();
			for (const [groupName, group] of Object.entries(global.groups)) {
				if (opts.group && groupName !== opts.group) continue;
				group.routes = group.routes.filter((r) => r.domain !== domain);
			}
			saveGlobalConfig(global);
			console.log(`✓ Removed route: ${domain}`);
		});

	// groups command
	const groupsCmd = program
		.command('groups')
		.description('Manage route groups');

	groupsCmd
		.command('activate <name>')
		.description('Activate a group')
		.action((name: string) => {
			const local = loadLocalConfig() ?? { mocks: {} };
			local.activeGroups = [
				...(local.activeGroups ?? []).filter((g) => g !== name),
				name,
			];
			saveLocalConfig(local);
			console.log(`✓ Activated group: ${name}`);
		});

	groupsCmd
		.command('deactivate <name>')
		.description('Deactivate a group')
		.action((name: string) => {
			const local = loadLocalConfig() ?? { mocks: {} };
			local.activeGroups = (local.activeGroups ?? []).filter((g) => g !== name);
			saveLocalConfig(local);
			console.log(`✓ Deactivated group: ${name}`);
		});

	// mock command
	program
		.command('mock <route> <variant>')
		.description('Set mock variant for a route (use --off to disable)')
		.option('--off', 'Disable mock (use live mode)')
		.action((route: string, variant: string, opts: { off?: boolean }) => {
			const local = loadLocalConfig() ?? { mocks: {} };
			if (!local.mocks[route]) {
				local.mocks[route] = { variants: {} };
			}
			const mockRoute = local.mocks[route];
			if (mockRoute) {
				if (opts.off) {
					mockRoute.active = undefined;
					console.log(`✓ Mock disabled for ${route} (live mode)`);
				} else {
					mockRoute.active = variant;
					console.log(`✓ Mock set to "${variant}" for ${route}`);
				}
			}
			saveLocalConfig(local);
		});

	try {
		await program.parseAsync(args, { from: 'user' });
	} catch (err) {
		if (err instanceof Error && 'exitCode' in err) {
			process.exitCode = getExitCode(err);
		} else {
			fatalError(formatError(err));
		}
	}
}

runIfMain(import.meta.url, () => {
	runCLI();
});
