import { Box, Text, useInput } from 'ink';
import type { HelpMenuProps } from './HelpMenu.types.js';

type HelpShortcut = {
	key: string;
	label: string;
};

type HelpSection = {
	title: string;
	color: string;
	shortcuts: HelpShortcut[];
};

const HELP_SECTIONS: HelpSection[] = [
	{
		title: 'Traffic',
		color: 'cyan',
		shortcuts: [
			{ key: '↑/↓', label: 'Navigate requests' },
			{ key: 'Enter', label: 'Open detail inspector' },
			{ key: 'x', label: 'Clear traffic log' },
		],
	},
	{
		title: 'Detail',
		color: 'green',
		shortcuts: [
			{ key: 'Tab', label: 'Switch request ↔ response' },
			{ key: '↑/↓', label: 'Scroll active pane' },
			{ key: 'Esc', label: 'Go back' },
		],
	},
	{
		title: 'Overlays',
		color: 'yellow',
		shortcuts: [
			{ key: 'm', label: 'Mock picker' },
			{ key: 's', label: 'Snapshot as mock' },
			{ key: 't', label: 'Latency' },
			{ key: 'c', label: 'Route config' },
		],
	},
	{
		title: 'General',
		color: 'white',
		shortcuts: [
			{ key: 'h', label: 'Help menu' },
			{ key: 'q', label: 'Quit' },
		],
	},
];

export function HelpMenu({ onClose }: HelpMenuProps) {
	useInput((input, key) => {
		if (key.escape || input === 'h') {
			onClose();
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="magenta"
			paddingX={2}
			paddingY={1}
		>
			<Box marginBottom={1} justifyContent="center">
				<Text bold color="magenta">
					YAOSGit proxy - Keyboard Shortcuts
				</Text>
			</Box>

			<Box flexDirection="row" gap={4} justifyContent="center">
				{HELP_SECTIONS.map((section, _sectionIdx) => (
					<Box key={section.title} flexDirection="column" gap={1}>
						<Text
							bold
							underline
							color={section.color as Parameters<typeof Text>[0]['color']}
						>
							{section.title}
						</Text>
						{section.shortcuts.map(({ key, label }) => (
							<Text key={key}>
								<Text bold>{key}</Text> : {label}
							</Text>
						))}
					</Box>
				))}
			</Box>
		</Box>
	);
}
