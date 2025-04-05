import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const aliasDirArg = process.argv.find(arg => arg.startsWith('--alias-dir='))
const aliasDir = aliasDirArg ? aliasDirArg.split('=')[1] : process.env.VITEST_ALIAS_DIR || 'src'

export default defineConfig({
	resolve: {
		alias: {
			'@': fileURLToPath(new URL(`./${aliasDir}`, import.meta.url)),
		},
	},
	test: {
		include: [
			'src/**/*.test.ts',
		],
		exclude: [
			'src/web/**/*',
		],
		testTimeout: 5000,
		hookTimeout: 5000,
		typecheck: {
			tsconfig: './src/tsconfig.json',
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: [
				'src/**/*.ts',
			],
			exclude: [
				'src/web/**/*',
				'**/*.test.*',
				'**/*.d.ts',
				'**/types.ts',
				'**/*.spec.ts',
			],
		},
	},
})
