import type { Command, BaseDeps } from '@yaos-git/toolkit/types';

export interface HelpMenuProps<TDeps extends BaseDeps = BaseDeps> {
	commands: Command<TDeps>[];
	sectionColors: Record<string, string>;
	title: string;
	onClose: () => void;
}
