import { Box, Text } from 'ink';
import type { ControlBarProps } from './ControlBar.types.js';

export function ControlBar({ commands, width }: ControlBarProps) {
	const visibleCommands = commands.filter((cmd) => cmd.footer && cmd.isEnabled());

	const terminalWidth = width ?? process.stdout.columns ?? 80;
	const availableWidth = terminalWidth - 8;

	// Branding: "YAOSGit : proxy"
	const brandWidth = 16;
	let currentWidth = brandWidth;

	const moreWidth = 5; // " │ ..."
	const truncatedCommands: typeof visibleCommands = [];
	let hasMore = false;
	for (const cmd of visibleCommands) {
		const cmdWidth = 3 + String(cmd.displayKey).length + 1 + cmd.displayText.length;
		const remaining = visibleCommands.length - truncatedCommands.length - 1;
		const reserveForMore = remaining > 0 ? moreWidth : 0;
		if (currentWidth + cmdWidth + reserveForMore <= availableWidth) {
			truncatedCommands.push(cmd);
			currentWidth += cmdWidth;
		} else {
			hasMore = true;
			break;
		}
	}

	return (
		<Box borderStyle="round" borderColor="gray" paddingX={1}>
			<Text wrap="end">
				<Text bold color="magenta">
					YAOSGit
					<Text dimColor> : </Text>
					proxy
				</Text>
				{truncatedCommands.map((cmd) => (
					<Text key={cmd.id}>
						<Text dimColor> │ </Text>
						<Text bold>{cmd.displayKey}</Text> {cmd.displayText}
					</Text>
				))}
				{hasMore && <Text dimColor> │ ...</Text>}
			</Text>
		</Box>
	);
}
