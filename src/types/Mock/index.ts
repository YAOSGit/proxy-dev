type MockVariant = {
	file: string;
	status: number;
	headers?: Record<string, string>;
	latencyMs?: number;
};

type MockRoute = {
	variants: Record<string, MockVariant>;
	active?: string;
};

export type { MockVariant, MockRoute };
