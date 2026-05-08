import net from 'node:net';
import type { DaemonCommand, DaemonResponse } from '../types/Ipc/index.js';

class DaemonClient {
	private socketPath: string;

	constructor(socketPath: string) {
		this.socketPath = socketPath;
	}

	private sendCommand(command: DaemonCommand): Promise<DaemonResponse> {
		return new Promise((resolve, reject) => {
			const socket = net.createConnection(this.socketPath);
			let buffer = '';
			let settled = false;

			const timeout = setTimeout(() => {
				if (!settled) {
					settled = true;
					socket.destroy();
					reject(new Error('Daemon request timed out'));
				}
			}, 5000);

			socket.on('connect', () => {
				socket.write(`${JSON.stringify(command)}\n`);
			});

			socket.on('data', (data) => {
				buffer += data.toString();

				const newlineIdx = buffer.indexOf('\n');
				if (newlineIdx !== -1) {
					const line = buffer.slice(0, newlineIdx);
					if (!settled) {
						settled = true;
						clearTimeout(timeout);
						socket.destroy();
						try {
							resolve(JSON.parse(line) as DaemonResponse);
						} catch {
							reject(new Error('Invalid JSON response from daemon'));
						}
					}
				}
			});

			socket.on('error', (err) => {
				if (!settled) {
					settled = true;
					clearTimeout(timeout);
					reject(err);
				}
			});
		});
	}

	async ping(): Promise<boolean> {
		try {
			const response = await this.sendCommand({ action: 'ping' });
			return response.ok;
		} catch {
			return false;
		}
	}

	async addHost(domain: string): Promise<void> {
		const response = await this.sendCommand({ action: 'add', domain });
		if (!response.ok) {
			throw new Error(response.error);
		}
	}

	async removeHost(domain: string): Promise<void> {
		const response = await this.sendCommand({ action: 'remove', domain });
		if (!response.ok) {
			throw new Error(response.error);
		}
	}

	async cleanup(): Promise<void> {
		const response = await this.sendCommand({ action: 'cleanup' });
		if (!response.ok) {
			throw new Error(response.error);
		}
	}

	async listHosts(): Promise<string[]> {
		const response = await this.sendCommand({ action: 'list' });
		if (!response.ok) {
			throw new Error(response.error);
		}
		return response.domains ?? [];
	}

	async register(domain: string, port: number): Promise<void> {
		const response = await this.sendCommand({
			action: 'register',
			domain,
			port,
		});
		if (!response.ok) {
			throw new Error(response.error);
		}
	}

	async unregister(domain: string): Promise<void> {
		const response = await this.sendCommand({ action: 'unregister', domain });
		if (!response.ok) {
			throw new Error(response.error);
		}
	}

	async shutdown(): Promise<void> {
		try {
			const response = await this.sendCommand({ action: 'shutdown' });
			if (!response.ok) {
				throw new Error(response.error);
			}
		} catch {
			// Daemon may close before sending response — ignore errors
		}
	}

	close(): void {
		// No-op: each command creates a fresh connection
	}
}

export { DaemonClient };
