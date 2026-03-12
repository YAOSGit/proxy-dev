import { Box, Text } from 'ink';
import { truncateBody } from '../../utils/format/index.js';
import type { DetailInspectorProps } from './DetailInspector.types.js';

const MAX_VISIBLE_LINES = 30;
const MAX_BODY_DISPLAY = 2048;

const renderHeaders = (headers: Record<string, string>): string[] => {
	return Object.entries(headers).map(([k, v]) => `${k}: ${v}`);
};

export function DetailInspector({
	entry,
	activePane,
	scrollOffset,
	onClose: _onClose,
	onSwitchPane: _onSwitchPane,
}: DetailInspectorProps) {
	const requestLines = [
		`${entry.method} ${entry.path} HTTP/1.1`,
		`Host: ${entry.domain}`,
		...renderHeaders(entry.requestHeaders),
		'',
		...(entry.requestBody
			? truncateBody(entry.requestBody, MAX_BODY_DISPLAY).split('\n')
			: ['(no body)']),
	];

	const responseLines = [
		`HTTP/1.1 ${entry.status}`,
		...renderHeaders(entry.responseHeaders),
		'',
		...(entry.responseBody
			? truncateBody(entry.responseBody, MAX_BODY_DISPLAY).split('\n')
			: ['(no body)']),
	];

	const paneLines = activePane === 'request' ? requestLines : responseLines;
	const visibleLines = paneLines.slice(
		scrollOffset,
		scrollOffset + MAX_VISIBLE_LINES,
	);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Box flexDirection="row" gap={1} paddingX={1}>
				<Text
					color={activePane === 'request' ? 'cyan' : 'gray'}
					bold={activePane === 'request'}
				>
					{activePane === 'request' ? '●' : '○'} Request
				</Text>
				<Text color="gray">|</Text>
				<Text
					color={activePane === 'response' ? 'cyan' : 'gray'}
					bold={activePane === 'response'}
				>
					{activePane === 'response' ? '●' : '○'} Response
				</Text>
				<Box flexGrow={1} />
			</Box>
			<Box
				borderStyle="single"
				borderColor={activePane === 'request' ? 'cyan' : 'gray'}
				flexGrow={1}
				paddingX={1}
				flexDirection="column"
			>
				{visibleLines.map((line, i) => {
					const key = `line-${scrollOffset + i}`;
					return <Text key={key}>{line}</Text>;
				})}
			</Box>
		</Box>
	);
}
