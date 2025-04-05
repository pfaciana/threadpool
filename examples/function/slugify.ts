import { FunctionPool, importTaskWorker, importPersistentWorker, StatusType } from './../../src/index.ts'

const pool = new FunctionPool()
pool.race((data, thread) => console.log(`Finished First: ${thread.meta} = ${data}\n`))
pool.then((data, thread) => console.log(thread.meta, data))
pool.allSettled(() => console.log('\nDONE!', pool.status('completed', StatusType.COUNT)))

// Import a custom data url, where you inline the code
type W = {
	helloWorld: () => string;
	default: number;
}
const { default: fortyTwo, helloWorld } = await importTaskWorker<W>(`data:text/javascript,
  export const helloWorld = () => "Hello, World!";	
  export default 42;
`)

pool.addTask(helloWorld(), 'helloWorld()')
pool.addTask(fortyTwo(), 'fortyTwo()')
pool.addTask(async () => {
	// Import a custom data url, where you persist state
	type C = {
		counter: number;
		count: () => number;
		maybeCount: () => boolean;
	}
	const getRandomNumber = (): boolean => !!Math.round(Math.random())
	const { counter, count, maybeCount, terminate } = await importPersistentWorker<C>(`data:text/javascript,
		export let counter = 0;	
		export const count = () => counter+=1;
		export const maybeCount = ${getRandomNumber.toString()};
	`)
	await count()
	await count()
	if (await maybeCount()) {
		await count()
	}
	const result = await counter()
	terminate()
	return result
}, 'Counted')