import type { MockRoute } from '../../types/Mock/index.js';

interface MockPickerProps {
	routeKey: string;
	mockRoute: MockRoute | null;
	onSelect: (variantName: string | null) => void;
	onClose: () => void;
	selectedIndex?: number;
}

export type { MockPickerProps };
