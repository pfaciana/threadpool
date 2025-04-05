import typescript from '@rollup/plugin-typescript'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'

// Plugin to run tsc before the build with error whitelisting
function runTsc() {
	return {
		name: 'run-tsc',
		buildStart() {
			return new Promise((resolve, reject) => {
				const whitelistedErrors = new Set([
					'TS5097', // An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
					'TS5096'  // Option 'allowImportingTsExtensions' can only be used when either 'noEmit' or 'emitDeclarationOnly' is set.
				])
				const tsc = spawn('tsc', [], { shell: true })
				let output = '', errorOutput = ''
				tsc.stdout.on('data', (data) => {
					const str = data.toString()
					output += str
					process.stdout.write(str)
				})
				tsc.stderr.on('data', (data) => {
					const str = data.toString()
					errorOutput += str
					process.stderr.write(str)
				})
				tsc.on('close', (code) => {
					if (code != 0) {
						let combinedOutput = output + errorOutput, errorRegex = /error (TS\d+):/g, foundErrors = new Set(), match
						while ((match = errorRegex.exec(combinedOutput)) !== null) {
							foundErrors.add(match[1])
						}
						const criticalErrors = Array.from(foundErrors).filter(errorCode => !whitelistedErrors.has(errorCode))
						if (criticalErrors.length) {
							return reject(new Error(`TypeScript compilation failed with critical errors: ${criticalErrors.join(', ')}`))
						}
					}
					resolve()
				})
			})
		},
	}
}

// Plugin to fix declaration file imports (.ts -> .js)
function fixDeclarationImports() {
	return {
		name: 'fix-declaration-imports',
		writeBundle: async () => {
			// Wait a bit for TypeScript to finish generating declaration files
			await new Promise(resolve => setTimeout(resolve, 100))

			const declarationDir = path.resolve('./dist')

			async function processDir(dir) {
				const files = await fs.promises.readdir(dir)

				for (const file of files) {
					const filePath = path.join(dir, file)
					const stat = await fs.promises.stat(filePath)

					if (stat.isDirectory()) {
						await processDir(filePath)
					} else if (file.endsWith('.d.ts')) {
						let content = await fs.promises.readFile(filePath, 'utf8')
						// Replace .ts imports with .js imports in static imports
						content = content.replace(/from\s+['"](.+?)\.ts['"]/g, 'from \'$1.js\'')
						// Replace .ts imports with .js imports in dynamic imports
						content = content.replace(/import\(['"](.+?)\.ts['"]\)/g, 'import(\'$1.js\')')
						await fs.promises.writeFile(filePath, content, 'utf8')
					}
				}
			}

			await processDir(declarationDir)
		},
	}
}

export default {
	input: 'src/index.ts',
	output: {
		dir: 'dist',
		format: 'esm',
		preserveModules: true,
	},
	external: [
		/node_modules/,
	],
	plugins: [
		runTsc(),
		typescript({ tsconfig: './tsconfig.json' }),
		fixDeclarationImports(),
	],
}
