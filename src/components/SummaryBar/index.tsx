import { Box, Text } from 'ink';
import { formatBytes } from '../../utils/format/index.js';
import {
	BORDER_COLOR,
	CONTENT_TYPE_COLOR,
	COUNT_COLOR,
	EMPTY_STATE_COLOR,
	LABEL_COLOR,
	SIZE_COLOR,
} from './SummaryBar.consts.js';
import type { SummaryBarProps } from './SummaryBar.types.js';

export function SummaryBar(props: SummaryBarProps) {
	const { entry } = props;

	if (!entry) {
		return (
			<Box borderStyle="round" borderColor={BORDER_COLOR} paddingX={1}>
				<Text color={EMPTY_STATE_COLOR}>Select a request to see details</Text>
			</Box>
		);
	}

	const requestHeaderCount = Object.keys(entry.requestHeaders).length;
	const responseHeaderCount = Object.keys(entry.responseHeaders).length;
	const bodySize = entry.responseBody
		? Buffer.byteLength(entry.responseBody, 'utf-8')
		: 0;
	const contentType =
		entry.responseHeaders['content-type'] ??
		entry.responseHeaders['Content-Type'] ??
		'unknown';

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor={BORDER_COLOR}
			paddingX={1}
		>
			<Box flexDirection="row" gap={3}>
				<Text>
					<Text color={LABEL_COLOR}>Req Headers:</Text>{' '}
					<Text color={COUNT_COLOR}>{requestHeaderCount}</Text>
				</Text>
				<Text>
					<Text color={LABEL_COLOR}>Res Headers:</Text>{' '}
					<Text color={COUNT_COLOR}>{responseHeaderCount}</Text>
				</Text>
				<Text>
					<Text color={LABEL_COLOR}>Body:</Text>{' '}
					<Text color={SIZE_COLOR}>{formatBytes(bodySize)}</Text>
				</Text>
				<Text>
					<Text color={LABEL_COLOR}>Content-Type:</Text>{' '}
					<Text color={CONTENT_TYPE_COLOR}>{contentType.split(';')[0]}</Text>
				</Text>
			</Box>
		</Box>
	);
}
