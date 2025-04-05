import resolve from '@rollup/plugin-node-resolve'
import { swc as swc3, defineRollupSwcOption, minify, defineRollupSwcMinifyOption } from 'rollup-plugin-swc3'
import fs from 'fs'
import path from 'path'

const baseDir = 'examples/web'
const srcDir = `${baseDir}/src`
const distDir = `${baseDir}/dist`
const inputFiles = fs.readdirSync(srcDir).filter(file => file.endsWith('.ts')).map(file => ({
	name: file.replace('.ts', ''),
	path: path.join(srcDir, file),
}))

const targets = '> 0.2%, last 2 years, Firefox ESR, not dead'

const config = [
	...inputFiles.map(file => ({
		input: file.path,
		output: [
			{ file: `${distDir}/${file.name}.js`, format: 'es' },
		],
		plugins: [
			resolve({ browser: true }),
			swc3(defineRollupSwcOption({
				tsconfig: false,
				jsc: { parser: { syntax: 'typescript', jsx: false }, minify: { compress: false, mangle: false } },
				env: { targets },
			})),
		],
	})),
]

export default config
