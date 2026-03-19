import { Box, Text, useInput } from 'ink';
import { useState } from 'react';
import type { Route } from '../../types/Route/index.js';
import {
	ACTIVE_GROUP_COLOR,
	ACTIVE_STEP_COLOR,
	CURSOR_COLOR,
	DOMAIN_ERROR_COLOR,
	GLOBAL_SOURCE_COLOR,
	HEADING_COLOR,
	HTTPS_COLOR,
	INACTIVE_GROUP_COLOR,
	INACTIVE_STEP_COLOR,
	LATENCY_COLOR,
	LOCAL_SOURCE_COLOR,
	POINTER_COLOR,
} from './RouteConfig.consts.js';
import type {
	AddGroupFormProps,
	AddRouteFormProps,
	RouteConfigProps,
} from './RouteConfig.types.js';

const DOMAIN_REGEX = /^[a-zA-Z0-9._-]+$/;

type ListItem =
	| { type: 'group'; name: string; description?: string }
	| { type: 'route'; groupName: string; index: number; route: Route }
	| { type: 'add-route'; groupName: string }
	| { type: 'add-group' };

const AddRouteForm = ({ groupName, onSave, onCancel }: AddRouteFormProps) => {
	const [domain, setDomain] = useState('');
	const [path, setPath] = useState('');
	const [target, setTarget] = useState('');
	const [httpsUpgrade, setHttpsUpgrade] = useState(false);
	const [step, setStep] = useState<'domain' | 'path' | 'target' | 'upgrade'>(
		'domain',
	);
	const [domainError, setDomainError] = useState('');

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}
		if (key.return) {
			if (step === 'domain') {
				const trimmed = domain.trim();
				if (!trimmed) return;
				if (!DOMAIN_REGEX.test(trimmed)) {
					setDomainError('Only alphanumeric, dots, hyphens, and underscores');
					return;
				}
				setDomainError('');
				setStep('path');
			} else if (step === 'path') {
				setStep('target');
			} else if (step === 'target') {
				if (target.trim()) setStep('upgrade');
			} else if (step === 'upgrade') {
				const t = parseInt(target, 10);
				if (!Number.isNaN(t)) {
					onSave({
						domain: domain.trim(),
						path: path.trim() || undefined,
						target: t,
						httpsUpgrade,
					});
				}
			}
		} else if (key.backspace || key.delete) {
			if (step === 'domain') {
				setDomain((p) => p.slice(0, -1));
				setDomainError('');
			} else if (step === 'path') setPath((p) => p.slice(0, -1));
			else if (step === 'target') setTarget((p) => p.slice(0, -1));
		} else if (input && !key.ctrl && !key.meta) {
			if (step === 'domain') {
				setDomain((p) => p + input);
				setDomainError('');
			} else if (step === 'path') setPath((p) => p + input);
			else if (step === 'target' && /^\d$/.test(input))
				setTarget((p) => p + input);
			else if (step === 'upgrade') {
				if (input.toLowerCase() === 'y') setHttpsUpgrade(true);
				else if (input.toLowerCase() === 'n') setHttpsUpgrade(false);
			}
		}
	});

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1} borderStyle="round">
			<Text bold color={HEADING_COLOR}>
				Add Route to {groupName}
			</Text>
			<Box flexDirection="column">
				<Box>
					<Text color={step === 'domain' ? ACTIVE_STEP_COLOR : INACTIVE_STEP_COLOR}>Domain: </Text>
					<Text>
						{domain}
						{step === 'domain' && <Text color={CURSOR_COLOR}>|</Text>}
					</Text>
				</Box>
				{domainError && step === 'domain' && (
					<Text color={DOMAIN_ERROR_COLOR}> {domainError}</Text>
				)}
			</Box>
			{step !== 'domain' && (
				<Box>
					<Text color={step === 'path' ? ACTIVE_STEP_COLOR : INACTIVE_STEP_COLOR}>
						Path prefix (optional):{' '}
					</Text>
					<Text>
						{path}
						{step === 'path' && <Text color={CURSOR_COLOR}>|</Text>}
					</Text>
				</Box>
			)}
			{(step === 'target' || step === 'upgrade') && (
				<Box>
					<Text color={step === 'target' ? ACTIVE_STEP_COLOR : INACTIVE_STEP_COLOR}>
						Target port:{' '}
					</Text>
					<Text>
						{target}
						{step === 'target' && <Text color={CURSOR_COLOR}>|</Text>}
					</Text>
				</Box>
			)}
			{step === 'upgrade' && (
				<Box>
					<Text color={ACTIVE_STEP_COLOR}>HTTP → HTTPS upgrade? (y/n): </Text>
					<Text color={httpsUpgrade ? HTTPS_COLOR : DOMAIN_ERROR_COLOR}>
						{httpsUpgrade ? 'Yes' : 'No'}
					</Text>
				</Box>
			)}
		</Box>
	);
};

const AddGroupForm = ({ onSave, onCancel, configMode }: AddGroupFormProps) => {
	const [name, setName] = useState('');
	const [step, setStep] = useState<'name' | 'source'>('name');
	const [source, setSource] = useState<'local' | 'global'>('local');

	useInput((input, key) => {
		if (key.escape) {
			onCancel();
			return;
		}
		if (step === 'name') {
			if (key.return) {
				if (name.trim()) {
					if (configMode === 'merged') {
						setStep('source');
					} else {
						onSave(name.trim());
					}
				}
			} else if (key.backspace || key.delete) {
				setName((p) => p.slice(0, -1));
			} else if (input && !key.ctrl && !key.meta) {
				setName((p) => p + input.toLowerCase().replace(/[^a-z0-9-]/g, ''));
			}
		} else if (step === 'source') {
			if (input.toLowerCase() === 'l') {
				setSource('local');
			} else if (input.toLowerCase() === 'g') {
				setSource('global');
			} else if (key.return) {
				onSave(name.trim(), source);
			}
		}
	});

	return (
		<Box flexDirection="column" paddingX={2} paddingY={1} borderStyle="round">
			<Text bold color={HEADING_COLOR}>
				Add Route Group
			</Text>
			<Box>
				<Text color={step === 'name' ? ACTIVE_STEP_COLOR : INACTIVE_STEP_COLOR}>Group Name: </Text>
				<Text>
					{name}
					{step === 'name' && <Text color={CURSOR_COLOR}>|</Text>}
				</Text>
			</Box>
			{step === 'source' && (
				<Box>
					<Text color={ACTIVE_STEP_COLOR}>Source [l]ocal / [g]lobal: </Text>
					<Text color={source === 'local' ? LOCAL_SOURCE_COLOR : GLOBAL_SOURCE_COLOR}>{source}</Text>
				</Box>
			)}
		</Box>
	);
};

export function RouteConfig({
	global,
	updateGlobal,
	activeGroups,
	onToggleGroup,
	onClose,
	configMode,
	taggedGroups,
}: RouteConfigProps) {
	const [mode, setMode] = useState<'list' | 'add-route' | 'add-group'>('list');
	const [targetGroup, setTargetGroup] = useState<string>('');
	const [selectedIndex, setSelectedIndex] = useState(0);

	const items: ListItem[] = [];
	for (const [name, group] of Object.entries(global.groups)) {
		items.push({ type: 'group', name, description: group.description });
		for (let i = 0; i < group.routes.length; i++) {
			items.push({
				type: 'route',
				groupName: name,
				index: i,
				route: group.routes[i] as Route,
			});
		}
		items.push({ type: 'add-route', groupName: name });
	}
	items.push({ type: 'add-group' });

	useInput((input, key) => {
		if (mode !== 'list') return; // let form handle

		if (key.upArrow) {
			setSelectedIndex((p) => Math.max(0, p - 1));
		} else if (key.downArrow) {
			setSelectedIndex((p) => Math.min(items.length - 1, p + 1));
		} else {
			const item = items[selectedIndex];
			if (!item) return;

			if (key.return) {
				if (item.type === 'add-route') {
					setTargetGroup(item.groupName);
					setMode('add-route');
				} else if (item.type === 'add-group') {
					setMode('add-group');
				} else if (item.type === 'group') {
					onToggleGroup(item.name);
				}
			} else if (key.escape) {
				onClose();
			} else if (input.toLowerCase() === 'g' && item.type === 'group') {
				onToggleGroup(item.name);
			} else if (input.toLowerCase() === 's' && item.type === 'route') {
				const newGlobal = { ...global };
				const route = newGlobal.groups[item.groupName]?.routes[item.index];
				if (!route) return;
				route.httpsUpgrade = !route.httpsUpgrade;
				updateGlobal(newGlobal);
			} else if (input.toLowerCase() === 'd') {
				if (item.type === 'route') {
					const newGlobal = { ...global };
					newGlobal.groups[item.groupName]?.routes.splice(item.index, 1);
					updateGlobal(newGlobal);
					setSelectedIndex((p) => Math.max(0, p - 1));
				} else if (item.type === 'group') {
					const newGlobal = { ...global };
					delete newGlobal.groups[item.name];
					updateGlobal(newGlobal);
					setSelectedIndex(0);
				}
			}
		}
	});

	if (mode === 'add-route') {
		return (
			<AddRouteForm
				groupName={targetGroup}
				onSave={(route) => {
					const newGlobal = { ...global };
					if (!newGlobal.groups[targetGroup])
						newGlobal.groups[targetGroup] = { routes: [] };
					newGlobal.groups[targetGroup]?.routes.push(route);
					updateGlobal(newGlobal);
					setMode('list');
				}}
				onCancel={() => setMode('list')}
			/>
		);
	}

	if (mode === 'add-group') {
		return (
			<AddGroupForm
				configMode={configMode}
				onSave={(name) => {
					const newGlobal = { ...global };
					if (!newGlobal.groups[name]) {
						newGlobal.groups[name] = { routes: [] };
						updateGlobal(newGlobal);
					}
					setMode('list');
				}}
				onCancel={() => setMode('list')}
			/>
		);
	}

	return (
		<Box flexDirection="column" borderStyle="round" paddingX={2} paddingY={1}>
			<Box flexDirection="row" justifyContent="space-between">
				<Text bold color={HEADING_COLOR}>
					Route Configuration
				</Text>
				<Text color={INACTIVE_STEP_COLOR}>Port 80 enabled + HTTPS Upgrade</Text>
			</Box>
			<Box flexDirection="column" marginTop={1}>
				{items.length === 0 ? (
					<Text color={INACTIVE_GROUP_COLOR}>No items</Text>
				) : (
					items.map((item, i) => {
						const isSelected = i === selectedIndex;
						const pointer = isSelected ? (
							<Text color={POINTER_COLOR}>{'> '}</Text>
						) : (
							<Text>{'  '}</Text>
						);

						if (item.type === 'group') {
							const isActive =
								activeGroups === undefined || activeGroups.includes(item.name);
							const tagged = taggedGroups[item.name];
							const sourcePrefix =
								configMode === 'merged' && tagged ? (
									<Text color={tagged.source === 'global' ? GLOBAL_SOURCE_COLOR : LOCAL_SOURCE_COLOR}>
										{tagged.source}:{' '}
									</Text>
								) : null;
							return (
								<Box key={`group-${item.name}`} marginTop={i > 0 ? 1 : 0}>
									{pointer}
									<Text color={isActive ? ACTIVE_GROUP_COLOR : INACTIVE_GROUP_COLOR}>
										{isActive ? '● ' : '○ '}
									</Text>
									{sourcePrefix}
									<Text
										bold
										color={isSelected ? ACTIVE_STEP_COLOR : isActive ? ACTIVE_STEP_COLOR : INACTIVE_GROUP_COLOR}
									>
										{item.name}
									</Text>
									{item.description && (
										<Text color={INACTIVE_GROUP_COLOR}> — {item.description}</Text>
									)}
								</Box>
							);
						}
						if (item.type === 'route') {
							return (
								<Box
									key={`route-${item.groupName}-${item.index}`}
									paddingLeft={4}
								>
									{pointer}
									<Box flexDirection="row" gap={1}>
										<Text
											color={isSelected ? ACTIVE_STEP_COLOR : INACTIVE_GROUP_COLOR}
											dimColor={!isSelected}
										>
											→{' '}
											<Text color={isSelected ? HEADING_COLOR : undefined}>
												{item.route.domain}
												{item.route.path ?? ''}
											</Text>{' '}
											→ localhost:{item.route.target}
										</Text>
										{item.route.httpsUpgrade && (
											<Text color={HTTPS_COLOR}>[HTTPS]</Text>
										)}
										{item.route.latencyMs !== undefined && (
											<Text color={LATENCY_COLOR}> +{item.route.latencyMs}ms</Text>
										)}
									</Box>
								</Box>
							);
						}
						if (item.type === 'add-route') {
							return (
								<Box key={`addroute-${item.groupName}`} paddingLeft={4}>
									{pointer}
									<Text color={INACTIVE_GROUP_COLOR} dimColor={!isSelected}>
										+ Add route...
									</Text>
								</Box>
							);
						}
						return (
							<Box key="addgroup" marginTop={1}>
								{pointer}
								<Text color={INACTIVE_GROUP_COLOR} dimColor={!isSelected}>
									+ Add new group...
								</Text>
							</Box>
						);
					})
				)}
			</Box>
		</Box>
	);
}
