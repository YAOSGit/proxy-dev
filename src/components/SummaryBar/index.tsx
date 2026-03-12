import { Box, Text } from 'ink';
import { formatBytes } from '../../utils/format/index.js';
import type { SummaryBarProps } from './SummaryBar.types.js';

export function SummaryBar(props: SummaryBarProps) {
	const { entry } = props;

	if (!entry) {
		return (
			<Box borderStyle="round" borderColor="gray" paddingX={1}>
				<Text color="gray">Select a request to see details</Text>
			</Box>
		);
	}

	const requestHeaderCount = Object.keys(entry.requestHeaders).length;
	const responseHeaderCount = Object.keys(entry.responseHeaders).length;
	const bodySize = entry.responseBody ? Buffer.byteLength(entry.responseBody, 'utf-8') : 0;
	const contentType = entry.responseHeaders['content-type'] ?? entry.responseHeaders['Content-Type'] ?? 'unknown';

	return (
		<Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
			<Box flexDirection="row" gap={3}>
				<Text>
					<Text color="gray">Req Headers:</Text> <Text color="cyan">{requestHeaderCount}</Text>
				</Text>
				<Text>
					<Text color="gray">Res Headers:</Text> <Text color="cyan">{responseHeaderCount}</Text>
				</Text>
				<Text>
					<Text color="gray">Body:</Text> <Text color="yellow">{formatBytes(bodySize)}</Text>
				</Text>
				<Text>
					<Text color="gray">Content-Type:</Text> <Text color="white">{contentType.split(';')[0]}</Text>
				</Text>
			</Box>
		</Box>
	);
}
