import React, { type ReactNode } from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'

import Hero from '../components/Hero'
import FeatureSection from '../components/FeatureSection'
import CodeExample from '../components/CodeExample'
import CTA from '../components/CTA'

export default function Home(): ReactNode {
	const { siteConfig } = useDocusaurusContext()
	return (
		<Layout
			title={`${siteConfig.title} - Multi-Environment Thread Management`}
			description={`${siteConfig.tagline}`}>

			{/* Hero Section */}
			<Hero
				title={`${siteConfig.title}`}
				tagline={`${siteConfig.tagline}`}
				primaryButton={{
					text: 'Get Started',
					link: '/docs/category/getting-started',
				}}
				secondaryButton={{
					text: 'API Reference',
					link: '/docs/category/api-reference',
				}}
			/>

			<main>
				{/* Features Section */}
				<FeatureSection
					title="Key Features"
					subtitle="ThreadPool makes concurrent programming simple and consistent across all JavaScript runtimes and environments"
					features={[
						{
							title: 'Cross-Environment Compatible',
							Svg: require('@site/static/img/cross-enviroment.svg').default,
							description: (
								<>
									One unified API that works across Node.js, Deno, Bun, and browser environments
									with consistent behavior and optimal performance in each runtime.
								</>
							),
						},
						{
							title: 'TypeScript First',
							Svg: require('@site/static/img/typescript.svg').default,
							description: (
								<>
									Built in TypeScript with full type safety. Get autocompletion, parameter validation,
									and type checking for your worker functions out of the box.
								</>
							),
						},
						{
							title: 'Promise-Based API',
							Svg: require('@site/static/img/promise-based.svg').default,
							description: (
								<>
									Familiar Promise-like interface (<code>then</code>, <code>catch</code>, <code>finally</code>, <code>allSettled</code>, <code>all</code>, <code>any</code>, <code>race</code>) for handling concurrent task execution and results.
								</>
							),
						},
					]}
				/>

				{/* Code Example Section */}
				<CodeExample
					title="Simple to Use"
					description="ThreadPool provides a unified API across different environments"
					featuresTitle="Powerful API, Simple Interface"
					features={[
						'Customizable worker scripts for advanced use cases',
						'Configurations for pool size, system resource thresholds, and ping intervals',
						'Seamless integration with existing JavaScript and TypeScript modules',
						'Persistent workers with stateful interactions',
						'Shared Workers support in browser environments',
					]}
					buttonText="See More Advanced Examples"
					buttonLink="/docs/category/examples"
					codeBlocks={[
						{
							title: 'Traditional Node Workers',
							description: (
								<>
									ThreadPool provides a simplified API for working with Node.js Worker Threads.
									Create worker pools, add tasks with custom data, and handle results through a Promise-like interface.
								</>
							),
							code: `import { WorkerPool } from '@renderdev/threadpool/node'

// Create a pool and import the worker script
const filename = new URL('./some-node-worker.ts', import.meta.url)
const pool = new WorkerPool(filename)

// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(\`All \${threads.length} tasks done!\`))

// Create tasks by passing \`workerData\` to the worker 
pool.addTask({ action: 'fibonacci', number: 42 })
// ...some more tasks
pool.addTask({ action: 'tribonacci', number: 32 })`,
							language: 'typescript',
						},
						{
							title: 'Server Worker Function',
							description: (
								<>
									Import any module and convert its exported functions into worker threads instantly.
									Maintain full TypeScript type checking while running functions in separate threads.
								</>
							),
							code: `import { FunctionPool, importTaskWorker } from '@renderdev/threadpool/function'

// Import the types. Optional, but this gives us type checking
import type * as mathType from './math.ts'
// Convert any module into a worker function (with type checking)
const filename = new URL('./math.ts', import.meta.url)
const { fibonacci, tribonacci } = await importTaskWorker<typeof mathType>(filename)

// Create a pool
const pool = new FunctionPool()

// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(\`All \${threads.length} tasks completed\`))

// Create tasks by converting the imported functions into threads that act as tasks
pool.addTask(fibonacci('42')) // Uh-oh! TS: fibonacci expects a number
// ...some more tasks
pool.addTask(tribonacci(32))`,
							language: 'typescript',
						},
						{
							title: 'Web Worker Function',
							description: (
								<>
									The same API works in browsers too! Create web workers from your functions with
									the same interface, making concurrent browser programming much simpler.
								</>
							),
							code: `import { WebFunctionPool, importTaskWebWorker } from '@renderdev/threadpool/web'

// Import the types. Optional, but this gives us type checking
import type * as mathType from './math.ts'
// Convert any module into a worker function (with type checking)
const filename = new URL('./math.ts', import.meta.url)
const { fibonacci, tribonacci } = await importTaskWebWorker<typeof mathType>(filename)

// Create a pool
const pool = new WebFunctionPool()

// Listen for when all the tasks are completed
pool.allSettled(threads => console.log(\`All \${threads.length} tasks completed\`))

// Create tasks by converting the imported functions into threads that act as tasks
pool.addTask(fibonacci('42')) // Uh-oh! TS: fibonacci expects a number
// ...some more tasks
pool.addTask(tribonacci(32))`,
							language: 'typescript',
						},
					]}
				/>

				{/* Call to Action Section */}
				<CTA
					title="Multi-Threading Made Simple"
					description="Streamline your development and enhance your JavaScript performance."
					buttons={[
						{
							text: 'Installation Guide',
							link: '/docs/getting-started/installation',
							isPrimary: true,
						},
						{
							text: 'GitHub Repository',
							link: 'https://github.com/pfaciana/threadpool',
							isPrimary: false,
						},
					]}
				/>
			</main>
		</Layout>
	)
}
