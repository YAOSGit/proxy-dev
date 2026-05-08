import type {
	ConfigMode,
	GlobalConfig,
	TaggedRouteGroup,
} from '../../types/Config/index.js';
import type { Route } from '../../types/Route/index.js';

interface RouteConfigProps {
	global: GlobalConfig;
	updateGlobal: (global: GlobalConfig) => void;
	activeGroups: string[] | undefined;
	onToggleGroup: (name: string) => void;
	onClose: () => void;
	configMode: ConfigMode;
	taggedGroups: Record<string, TaggedRouteGroup>;
}

interface AddRouteFormProps {
	groupName: string;
	onSave: (r: Route) => void;
	onCancel: () => void;
}

interface AddGroupFormProps {
	onSave: (name: string, source?: 'local' | 'global') => void;
	onCancel: () => void;
	configMode: ConfigMode;
}

export type { AddGroupFormProps, AddRouteFormProps, RouteConfigProps };
