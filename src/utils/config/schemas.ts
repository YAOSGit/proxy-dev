import { z } from 'zod';

const latencyConfigSchema = z.object({
	globalMs: z.number().min(0).default(0),
});

const routeSchema = z.object({
	domain: z
		.string()
		.min(1)
		.regex(
			/^[a-zA-Z0-9._-]+$/,
			'Domain must contain only alphanumeric characters, dots, hyphens, and underscores',
		),
	path: z.string().optional(),
	target: z.number().int().min(1).max(65535),
	latencyMs: z.number().min(0).optional(),
	httpsUpgrade: z.boolean().optional(),
});

const routeGroupSchema = z.object({
	description: z.string().optional(),
	routes: z.array(routeSchema),
});

const globalConfigSchema = z.object({
	version: z.number().int().default(1),
	port: z.number().int().min(1).max(65535).default(443),
	groups: z.record(z.string(), routeGroupSchema).default({}),
	latency: latencyConfigSchema.default({ globalMs: 0 }),
});

const mockVariantSchema = z.object({
	file: z
		.string()
		.min(1)
		.refine(
			(p) => !p.includes('..'),
			'Mock file path must not contain ".." segments',
		),
	status: z.number().int().min(100).max(599),
	headers: z.record(z.string(), z.string()).optional(),
	latencyMs: z.number().min(0).optional(),
});

const mockRouteSchema = z.object({
	variants: z.record(z.string(), mockVariantSchema),
	active: z.string().optional(),
});

const localConfigSchema = z.object({
	activeGroups: z.array(z.string()).optional(),
	mocks: z.record(z.string(), mockRouteSchema).default({}),
	latency: latencyConfigSchema.optional(),
	groups: z.record(z.string(), routeGroupSchema).optional(),
});

export {
	globalConfigSchema,
	latencyConfigSchema,
	localConfigSchema,
	mockRouteSchema,
	mockVariantSchema,
	routeGroupSchema,
	routeSchema,
};
