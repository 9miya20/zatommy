import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	test: {
		include: ['tests/**/*.test.ts'],
		globals: true
	},
	resolve: {
		alias: {
			$lib: resolve(import.meta.dirname, 'src/lib')
		}
	}
});
