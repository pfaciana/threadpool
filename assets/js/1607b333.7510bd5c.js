"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[3526],{3331:(e,n,l)=>{l.d(n,{R:()=>t,x:()=>i});var r=l(8101);const s={},a=r.createContext(s);function t(e){const n=r.useContext(a);return r.useMemo((function(){return"function"==typeof e?e(n):{...n,...e}}),[n,e])}function i(e){let n;return n=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:t(e.components),r.createElement(a.Provider,{value:n},e.children)}},7651:(e,n,l)=>{l.r(n),l.d(n,{assets:()=>o,contentTitle:()=>i,default:()=>h,frontMatter:()=>t,metadata:()=>r,toc:()=>d});const r=JSON.parse('{"id":"api/function/function-pool","title":"FunctionPool","description":"Manages a pool of FunctionThread instances for parallel execution.","source":"@site/docs/api/function/function-pool.md","sourceDirName":"api/function","slug":"/api/function/function-pool","permalink":"/threadpool/docs/api/function/function-pool","draft":false,"unlisted":false,"editUrl":"https://github.com/pfaciana/threadpool/tree/master/docs/docs/api/function/function-pool.md","tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2},"sidebar":"tutorialSidebar","previous":{"title":"FunctionThread","permalink":"/threadpool/docs/api/function/function-thread"},"next":{"title":"Worker Import Functions","permalink":"/threadpool/docs/api/function/main-thread"}}');var s=l(5105),a=l(3331);const t={sidebar_position:2},i="FunctionPool",o={},d=[{value:"Types",id:"types",level:2},{value:"SystemInfo",id:"systeminfo",level:3},{value:"Properties",id:"properties",level:2},{value:"maxThreadThreshold",id:"maxthreadthreshold",level:3},{value:"system",id:"system",level:3},{value:"Example",id:"example",level:4},{value:"poolSize",id:"poolsize",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor",id:"constructor",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Example",id:"example-1",level:4},{value:"addTask",id:"addtask",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns",level:4},{value:"Example",id:"example-2",level:4},{value:"hasAvailableThread",id:"hasavailablethread",level:3},{value:"Returns",id:"returns-1",level:4},{value:"status",id:"status",level:3},{value:"isCompleted",id:"iscompleted",level:3},{value:"Returns",id:"returns-2",level:4},{value:"then",id:"then",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-3",level:4},{value:"Example",id:"example-3",level:4},{value:"catch",id:"catch",level:3},{value:"Parameters",id:"parameters-3",level:4},{value:"Returns",id:"returns-4",level:4},{value:"Example",id:"example-4",level:4},{value:"finally",id:"finally",level:3},{value:"Parameters",id:"parameters-4",level:4},{value:"Returns",id:"returns-5",level:4},{value:"Example",id:"example-5",level:4},{value:"allSettled",id:"allsettled",level:3},{value:"Parameters",id:"parameters-5",level:4},{value:"Returns",id:"returns-6",level:4},{value:"Example",id:"example-6",level:4},{value:"all",id:"all",level:3},{value:"Parameters",id:"parameters-6",level:4},{value:"Returns",id:"returns-7",level:4},{value:"Example",id:"example-7",level:4},{value:"any",id:"any",level:3},{value:"Parameters",id:"parameters-7",level:4},{value:"Returns",id:"returns-8",level:4},{value:"Example",id:"example-8",level:4},{value:"race",id:"race",level:3},{value:"Parameters",id:"parameters-8",level:4},{value:"Returns",id:"returns-9",level:4},{value:"Example",id:"example-9",level:4},{value:"Events",id:"events",level:2},{value:"worker.init",id:"workerinit",level:3},{value:"worker.message",id:"workermessage",level:3},{value:"worker.error",id:"workererror",level:3},{value:"worker.messageerror",id:"workermessageerror",level:3},{value:"worker.exit",id:"workerexit",level:3},{value:"worker.status",id:"workerstatus",level:3},{value:"complete",id:"complete",level:3},{value:"Example",id:"example-10",level:4}];function c(e){const n={code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,a.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(n.header,{children:(0,s.jsx)(n.h1,{id:"functionpool",children:"FunctionPool"})}),"\n",(0,s.jsx)(n.p,{children:"Manages a pool of FunctionThread instances for parallel execution."}),"\n",(0,s.jsx)(n.p,{children:"FunctionPool provides a high-level API for managing multiple function-based threads, automatically handling queuing, execution, and resource monitoring. It offers Promise-like APIs and combinators (then, catch, all, race, etc.) for working with multiple concurrent tasks."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"// Create a pool with default settings\nconst pool = new FunctionPool();\n\n// Add several computational tasks\npool.addTask(async () => {\n  // Task 1: Calculate something complex\n  return await complexCalculation(500000);\n});\n\npool.addTask(async () => {\n  // Task 2: Process some data\n  return await processData(largeDataset);\n});\n\n// Wait for all tasks to complete\npool.allSettled(threads => {\n  console.log(`All ${threads.length} tasks completed`);\n  threads.forEach(thread => {\n    console.log(`Thread result: ${thread.message}`);\n  });\n});\n\n// Or handle results as they complete\npool.then((data, thread) => {\n  console.log(`Thread completed with result:`, data);\n});\n"})}),"\n",(0,s.jsx)(n.h2,{id:"types",children:"Types"}),"\n",(0,s.jsx)(n.h3,{id:"systeminfo",children:"SystemInfo"}),"\n",(0,s.jsx)(n.p,{children:"Information about the system's hardware resources."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"type SystemInfo = {\n  cores: number;   // Number of physical CPU cores\n  threads: number; // Number of logical CPU threads\n  memory: number;  // Total system memory in bytes\n}\n"})}),"\n",(0,s.jsx)(n.h2,{id:"properties",children:"Properties"}),"\n",(0,s.jsx)(n.h3,{id:"maxthreadthreshold",children:"maxThreadThreshold"}),"\n",(0,s.jsx)(n.p,{children:"Maximum CPU usage threshold (percentage) for scheduling threads. When CPU usage is above this threshold, no new threads will be scheduled."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"maxThreadThreshold: number = 98\n"})}),"\n",(0,s.jsx)(n.h3,{id:"system",children:"system"}),"\n",(0,s.jsx)(n.p,{children:"Gets information about the system's hardware resources."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"get system(): SystemInfo\n"})}),"\n",(0,s.jsx)(n.h4,{id:"example",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"const pool = new FunctionPool();\nconsole.log(`Running on a system with ${pool.system.cores} physical cores`);\nconsole.log(`${pool.system.threads} logical threads available`);\nconsole.log(`${Math.round(pool.system.memory / 1024 / 1024)} MB RAM`);\n"})}),"\n",(0,s.jsx)(n.h3,{id:"poolsize",children:"poolSize"}),"\n",(0,s.jsx)(n.p,{children:"Gets or sets the maximum number of threads that can run concurrently. Defaults to the number of physical CPU cores minus one."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"get poolSize(): number\nset poolSize(value: number)\n"})}),"\n",(0,s.jsx)(n.h2,{id:"methods",children:"Methods"}),"\n",(0,s.jsx)(n.h3,{id:"constructor",children:"constructor"}),"\n",(0,s.jsx)(n.p,{children:"Creates a new FunctionPool."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"constructor(options: Record<string, any> = {})\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"options"}),": Pool configuration options","\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"pingInterval"}),": Interval in ms between task scheduling attempts"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"poolSize"}),": Maximum number of concurrent threads"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"maxThreadThreshold"}),": Maximum CPU usage threshold for scheduling threads"]}),"\n"]}),"\n"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-1",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"// Create a pool with custom settings\nconst pool = new FunctionPool({\n  poolSize: 4,              // Run at most 4 tasks concurrently\n  pingInterval: 200,        // Check for available tasks every 200ms\n  maxThreadThreshold: 85    // Don't start new tasks if CPU usage is above 85%\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"addtask",children:"addTask"}),"\n",(0,s.jsx)(n.p,{children:"Adds a task (function) to the pool for execution."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"addTask(workerFn: () => Promise<any>, meta?: any): FunctionThread\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"workerFn"}),": Async function to execute"]}),"\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"meta"}),": Optional metadata to associate with the thread"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"The created FunctionThread instance"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-2",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"// Add a task to process data\nconst thread = pool.addTask(async () => {\n  const data = await readFile('large-data.json');\n  return processData(JSON.parse(data));\n}, { id: 'data-processing-task' });\n\n// You can also work with the thread directly\nthread.on('message', result => {\n  console.log('Task completed with result:', result);\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"hasavailablethread",children:"hasAvailableThread"}),"\n",(0,s.jsx)(n.p,{children:"Checks if the pool has capacity for another active thread, taking into account both pool size and system CPU usage."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"hasAvailableThread(): boolean\n"})}),"\n",(0,s.jsx)(n.h4,{id:"returns-1",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"boolean"}),": True if another thread can be started"]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"status",children:"status"}),"\n",(0,s.jsx)(n.p,{children:"Gets status information about the thread pool."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"status(statusKey?: string, returnType: number = 0): any\n"})}),"\n",(0,s.jsx)(n.p,{children:"See TaskPool.status() for detailed documentation on parameters and return types."}),"\n",(0,s.jsx)(n.h3,{id:"iscompleted",children:"isCompleted"}),"\n",(0,s.jsx)(n.p,{children:"Checks if all threads in the pool have completed."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"isCompleted(): boolean\n"})}),"\n",(0,s.jsx)(n.h4,{id:"returns-2",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"boolean"}),": True if all tasks are completed"]}),"\n"]}),"\n",(0,s.jsx)(n.h3,{id:"then",children:"then"}),"\n",(0,s.jsx)(n.p,{children:"Adds a callback for successful thread completions. The callback will be called each time any thread completes successfully."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"then(onFulfilled: (value: any, thread: FunctionThread) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"onFulfilled"}),": Callback for successful thread completion"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-3",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-3",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.then((data, thread) => {\n  console.log(`Thread ${thread.meta.id} succeeded with:`, data);\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"catch",children:"catch"}),"\n",(0,s.jsx)(n.p,{children:"Adds a callback for thread errors. The callback will be called each time any thread encounters an error."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"catch(onRejected: (error: any, type: 'error' | 'messageerror', thread: FunctionThread) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-3",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"onRejected"}),": Callback for thread errors"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-4",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-4",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.catch((error, type, thread) => {\n  console.error(`Thread ${thread.meta.id} failed:`, error);\n  console.error(`Error type: ${type}`);\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"finally",children:"finally"}),"\n",(0,s.jsx)(n.p,{children:"Adds a callback for thread completions, regardless of success or failure. The callback will be called each time any thread completes."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"finally(onFinally: (exitCode: any, thread: FunctionThread) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-4",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"onFinally"}),": Callback for thread completion"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-5",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-5",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.finally((exitCode, thread) => {\n  console.log(`Thread ${thread.meta.id} completed with exit code: ${exitCode}`);\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"allsettled",children:"allSettled"}),"\n",(0,s.jsx)(n.p,{children:"Registers a callback that will be invoked when all threads have completed, regardless of success or failure."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"allSettled(callback: (threads: FunctionThread[]) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-5",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"callback"}),": Function called with array of all completed threads"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-6",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-6",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.allSettled(threads => {\n  console.log(`All ${threads.length} tasks completed`);\n\n  // Count successful and failed threads\n  const successful = threads.filter(t => t.status.SUCCESS).length;\n  const failed = threads.filter(t => t.status.ERROR).length;\n\n  console.log(`${successful} succeeded, ${failed} failed`);\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"all",children:"all"}),"\n",(0,s.jsx)(n.p,{children:"Registers a callback that will be invoked when either all threads have completed successfully, or any thread fails."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"all(callback: (threads: FunctionThread[] | Error) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-6",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"callback"}),": Function called with array of threads or error"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-7",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-7",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.all(result => {\n  if (result instanceof Error) {\n    console.error('At least one task failed:', result);\n  } else {\n    console.log(`All ${result.length} tasks succeeded`);\n    result.forEach(thread => {\n      console.log(`Task result:`, thread.message);\n    });\n  }\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"any",children:"any"}),"\n",(0,s.jsx)(n.p,{children:"Registers a callback that will be invoked when either the first thread completes successfully, or all threads have failed."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"any(callback: (data: any | AggregateError, thread: FunctionThread | undefined) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-7",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"callback"}),": Function called with result or AggregateError"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-8",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-8",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.any((result, thread) => {\n  if (result instanceof AggregateError) {\n    console.error('All tasks failed:', result);\n  } else {\n    console.log(`Task succeeded with result:`, result);\n    console.log(`Completed thread:`, thread);\n  }\n});\n"})}),"\n",(0,s.jsx)(n.h3,{id:"race",children:"race"}),"\n",(0,s.jsx)(n.p,{children:"Registers a callback that will be invoked when any thread completes or fails. The callback receives the result or error from the first thread to settle."}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"race(callback: (data: any, thread: FunctionThread) => void): this\n"})}),"\n",(0,s.jsx)(n.h4,{id:"parameters-8",children:"Parameters"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsxs)(n.li,{children:[(0,s.jsx)(n.code,{children:"callback"}),": Function called with result and thread"]}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"returns-9",children:"Returns"}),"\n",(0,s.jsxs)(n.ul,{children:["\n",(0,s.jsx)(n.li,{children:"This instance for chaining"}),"\n"]}),"\n",(0,s.jsx)(n.h4,{id:"example-9",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"pool.race((result, thread) => {\n  console.log(`First thread to complete:`, thread);\n  console.log(`Result:`, result);\n\n  // Check if it was successful\n  if (thread.status.SUCCESS) {\n    console.log('Thread succeeded');\n  } else {\n    console.log('Thread failed');\n  }\n});\n"})}),"\n",(0,s.jsx)(n.h2,{id:"events",children:"Events"}),"\n",(0,s.jsx)(n.p,{children:"The FunctionPool class emits the following events:"}),"\n",(0,s.jsx)(n.h3,{id:"workerinit",children:"worker.init"}),"\n",(0,s.jsx)(n.p,{children:"When a worker thread is initialized and starts execution."}),"\n",(0,s.jsx)(n.h3,{id:"workermessage",children:"worker.message"}),"\n",(0,s.jsx)(n.p,{children:"When a worker thread completes successfully with a result."}),"\n",(0,s.jsx)(n.h3,{id:"workererror",children:"worker.error"}),"\n",(0,s.jsx)(n.p,{children:"When a worker thread throws an error directly during execution."}),"\n",(0,s.jsx)(n.h3,{id:"workermessageerror",children:"worker.messageerror"}),"\n",(0,s.jsx)(n.p,{children:"When a worker thread's promise rejects with an error."}),"\n",(0,s.jsx)(n.h3,{id:"workerexit",children:"worker.exit"}),"\n",(0,s.jsx)(n.p,{children:"When a worker thread completes execution (either success or error)."}),"\n",(0,s.jsx)(n.h3,{id:"workerstatus",children:"worker.status"}),"\n",(0,s.jsx)(n.p,{children:"When a worker thread's status changes."}),"\n",(0,s.jsx)(n.h3,{id:"complete",children:"complete"}),"\n",(0,s.jsx)(n.p,{children:"When all tasks in the pool have completed."}),"\n",(0,s.jsx)(n.h4,{id:"example-10",children:"Example"}),"\n",(0,s.jsx)(n.pre,{children:(0,s.jsx)(n.code,{className:"language-ts",children:"const pool = new FunctionPool();\n\npool.on('worker.init', (thread) => {\n  console.log('Worker started:', thread.meta);\n});\n\npool.on('worker.message', (data, thread) => {\n  console.log(`Worker ${thread.meta.id} completed with result:`, data);\n});\n\npool.on('worker.error', (error, thread) => {\n  console.error(`Worker ${thread.meta.id} failed with error:`, error);\n});\n\npool.on('complete', () => {\n  console.log('All workers have completed');\n});\n\n// Add tasks to the pool\npool.addTask(() => complexCalculation(), { id: 'task-1' });\npool.addTask(() => processData(), { id: 'task-2' });\n"})})]})}function h(e={}){const{wrapper:n}={...(0,a.R)(),...e.components};return n?(0,s.jsx)(n,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}}}]);