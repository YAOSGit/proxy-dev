import { Box, Text } from 'ink';
import { FocusablePane } from '@yaos-git/toolkit/tui/components';
import { theme } from '../../theme.js';
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
					color={activePane === 'request' ? theme.focus : theme.muted}
					bold={activePane === 'request'}
				>
					{activePane === 'request' ? '\u25CF' : '\u25CB'} Request
				</Text>
				<Text color={theme.muted}>|</Text>
				<Text
					color={activePane === 'response' ? theme.focus : theme.muted}
					bold={activePane === 'response'}
				>
					{activePane === 'response' ? '\u25CF' : '\u25CB'} Response
				</Text>
				<Box flexGrow={1} />
			</Box>
			<FocusablePane focused={true} theme={theme}>
				{visibleLines.map((line, i) => {
					const key = `line-${scrollOffset + i}`;
					return <Text key={key}>{line}</Text>;
				})}
			</FocusablePane>
		</Box>
	);
}
