import { createEsbuildConfig } from '@yaos-git/toolkit/build';
import * as esbuild from 'esbuild';

const shared = createEsbuildConfig({
	entry: 'src/app/cli.ts', // placeholder, overridden per build
});

// Build CLI (lean, no React)
await esbuild.build({
	...shared,
	entryPoints: ['src/app/cli.ts'],
	outfile: 'dist/cli.js',
});

// Build TUI (Ink/React dashboard)
await esbuild.build({
	...shared,
	entryPoints: ['src/app/tui.tsx'],
	outfile: 'dist/tui.js',
});

// Build proxy server (Worker)
await esbuild.build({
	...shared,
	entryPoints: ['src/proxy/server.ts'],
	outfile: 'dist/server.js',
});

// Build daemon (sudo hosts manager)
await esbuild.build({
	...shared,
	entryPoints: ['src/daemon/main.ts'],
	outfile: 'dist/daemon.js',
});
