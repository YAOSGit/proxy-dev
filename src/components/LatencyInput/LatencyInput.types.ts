interface LatencyInputProps {
	currentMs: number;
	isGlobal: boolean;
	routeKey?: string;
	onConfirm: (ms: number) => void;
	onClose: () => void;
	inputValue: string;
	onInputChange: (value: string) => void;
}

export type { LatencyInputProps };
