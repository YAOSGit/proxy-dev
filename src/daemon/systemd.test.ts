import { describe, expect, it } from 'vitest';
import { generateUnit, SERVICE_NAME } from './systemd.js';

describe('systemd unit', () => {
	it('generates a root service with restart, boot, and the baked socket', () => {
		const unit = generateUnit(
			'/usr/bin/node',
			'/opt/proxy-dev/daemon.js',
			'/home/u/.config/proxy-dev/daemon.sock',
		);

		expect(SERVICE_NAME).toBe('proxy-dev-daemon');
		expect(unit).toContain('ExecStart=/usr/bin/node /opt/proxy-dev/daemon.js');
		expect(unit).toContain(
			'Environment=PROXY_DEV_SOCKET=/home/u/.config/proxy-dev/daemon.sock',
		);
		expect(unit).toContain('Restart=always');
		expect(unit).toContain('WantedBy=multi-user.target');
	});
});
