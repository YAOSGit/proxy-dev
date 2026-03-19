import { Box, Text } from 'ink';
import {
	CA_TRUSTED_COLOR,
	CA_UNTRUSTED_COLOR,
	CONFIG_MODE_COLORS,
	ERROR_TEXT_COLOR,
	HOST_ACTIVE_COLOR,
	HOST_INACTIVE_COLOR,
	PORT_COLOR,
	PROXY_STATUS_COLORS,
	SEPARATOR_COLOR,
	UPTIME_COLOR,
	WARNING_TEXT_COLOR,
} from './SystemHeader.consts.js';
import type { SystemHeaderProps } from './SystemHeader.types.js';

const formatUptime = (ms: number): string => {
	const s = Math.floor(ms / 1000);
	const m = Math.floor(s / 60);
	const h = Math.floor(m / 60);
	if (h > 0) return `${h}h${m % 60}m`;
	if (m > 0) return `${m}m${s % 60}s`;
	return `${s}s`;
};

export function SystemHeader(props: SystemHeaderProps) {
	const {
		uptimeMs,
		hostCount,
		caTrusted,
		port,
		proxyStatus,
		lastError,
		configMode,
		configWarnings,
	} = props;
	const statusColor = PROXY_STATUS_COLORS[proxyStatus] ?? PROXY_STATUS_COLORS.starting;
	const modeColor = CONFIG_MODE_COLORS[configMode] ?? CONFIG_MODE_COLORS.merged;

	return (
		<Box
			width="100%"
			flexDirection="column"
			borderStyle="round"
			borderColor="gray"
			paddingX={1}
		>
			<Box flexDirection="row" gap={2}>
				<Text>
					uptime: <Text color={UPTIME_COLOR}>{formatUptime(uptimeMs)}</Text>
				</Text>
				<Text color={SEPARATOR_COLOR}>|</Text>
				<Text>
					port: <Text color={PORT_COLOR}>{port}</Text>
				</Text>
				<Text color={SEPARATOR_COLOR}>|</Text>
				<Text>
					status: <Text color={statusColor}>{proxyStatus}</Text>
				</Text>
				<Text color={SEPARATOR_COLOR}>|</Text>
				<Text>
					<Text color={hostCount > 0 ? HOST_ACTIVE_COLOR : HOST_INACTIVE_COLOR}>●</Text> {hostCount}{' '}
					hosts
				</Text>
				<Text color={SEPARATOR_COLOR}>|</Text>
				<Text color={caTrusted ? CA_TRUSTED_COLOR : CA_UNTRUSTED_COLOR}>
					CA: {caTrusted ? 'trusted' : 'not trusted'}
				</Text>
				<Text color={SEPARATOR_COLOR}>|</Text>
				<Text color={modeColor} dimColor={configMode === 'merged'}>
					{configMode.toUpperCase()}
				</Text>
			</Box>
			{proxyStatus === 'error' && lastError && (
				<Box>
					<Text color={ERROR_TEXT_COLOR}>ERROR: {lastError}</Text>
				</Box>
			)}
			{configWarnings && configWarnings.length > 0 && (
				<Box>
					<Text color={WARNING_TEXT_COLOR}>CONFIG: {configWarnings[0]}</Text>
				</Box>
			)}
		</Box>
	);
}

export { formatUptime };
