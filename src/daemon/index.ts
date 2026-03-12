export { DaemonClient } from './client.js';
export { generatePlist, LABEL, writePlist } from './launchd.js';
export type { DaemonServerConfig, DaemonServerHandle } from './server.js';
export { startDaemonServer } from './server.js';
export {
	cleanStaleDaemon,
	isDaemonRunning,
	spawnDaemon,
	waitForSocket,
} from './spawner.js';
