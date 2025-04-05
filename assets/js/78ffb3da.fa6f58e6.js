"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[7754],{3331:(e,s,t)=>{t.d(s,{R:()=>i,x:()=>r});var n=t(8101);const a={},l=n.createContext(a);function i(e){const s=n.useContext(l);return n.useMemo((function(){return"function"==typeof e?e(s):{...s,...e}}),[s,e])}function r(e){let s;return s=e.disableParentContext?"function"==typeof e.components?e.components(a):e.components||a:i(e.components),n.createElement(l.Provider,{value:s},e.children)}},5339:(e,s,t)=>{t.r(s),t.d(s,{assets:()=>o,contentTitle:()=>r,default:()=>u,frontMatter:()=>i,metadata:()=>n,toc:()=>d});const n=JSON.parse('{"id":"api/core/pool-status","title":"TaskPool","description":"Manages a pool of tasks with queuing and status tracking. Provides a system for managing concurrent tasks, limiting the number of simultaneously active tasks, and tracking task states as they move through the queue.","source":"@site/docs/api/core/pool-status.md","sourceDirName":"api/core","slug":"/api/core/pool-status","permalink":"/threadpool/docs/api/core/pool-status","draft":false,"unlisted":false,"editUrl":"https://github.com/pfaciana/threadpool/tree/master/docs/docs/api/core/pool-status.md","tags":[],"version":"current","sidebarPosition":2,"frontMatter":{"sidebar_position":2},"sidebar":"tutorialSidebar","previous":{"title":"ThreadStatus","permalink":"/threadpool/docs/api/core/thread-status"},"next":{"title":"Worker API","permalink":"/threadpool/docs/category/worker-api"}}');var a=t(5105),l=t(3331);const i={sidebar_position:2},r="TaskPool",o={},d=[{value:"Types",id:"types",level:2},{value:"TaskPoolOptions",id:"taskpooloptions",level:3},{value:"StatusField",id:"statusfield",level:3},{value:"StatusRawType",id:"statusrawtype",level:3},{value:"StatusCountType",id:"statuscounttype",level:3},{value:"CountStatusResponse",id:"countstatusresponse",level:3},{value:"PercentStatusResponse",id:"percentstatusresponse",level:3},{value:"RawStatus",id:"rawstatus",level:3},{value:"StatusResponse",id:"statusresponse",level:3},{value:"Constants",id:"constants",level:2},{value:"StatusType",id:"statustype",level:3},{value:"StatusAllField",id:"statusallfield",level:3},{value:"Properties",id:"properties",level:2},{value:"pingInterval",id:"pinginterval",level:3},{value:"poolSize",id:"poolsize",level:3},{value:"emitter",id:"emitter",level:3},{value:"Methods",id:"methods",level:2},{value:"constructor",id:"constructor",level:3},{value:"Parameters",id:"parameters",level:4},{value:"status",id:"status",level:3},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns",level:4},{value:"Examples",id:"examples",level:4},{value:"hasAvailableSlot",id:"hasavailableslot",level:3},{value:"Returns",id:"returns-1",level:4},{value:"isReady",id:"isready",level:3},{value:"Returns",id:"returns-2",level:4},{value:"isCompleted",id:"iscompleted",level:3},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-3",level:4},{value:"enqueue",id:"enqueue",level:3},{value:"Parameters",id:"parameters-3",level:4},{value:"next",id:"next",level:3},{value:"Returns",id:"returns-4",level:4},{value:"complete",id:"complete",level:3},{value:"Parameters",id:"parameters-4",level:4},{value:"Returns",id:"returns-5",level:4},{value:"Functions",id:"functions",level:2},{value:"round",id:"round",level:3},{value:"Parameters",id:"parameters-5",level:4},{value:"Returns",id:"returns-6",level:4}];function c(e){const s={code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,l.R)(),...e.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(s.header,{children:(0,a.jsx)(s.h1,{id:"taskpool",children:"TaskPool"})}),"\n",(0,a.jsx)(s.p,{children:"Manages a pool of tasks with queuing and status tracking. Provides a system for managing concurrent tasks, limiting the number of simultaneously active tasks, and tracking task states as they move through the queue."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"// Create a pool that will execute 2 tasks at a time\nconst pool = new TaskPool<string>({\n  pingInterval: 100, // Check for available tasks every 100ms\n  poolSize: 2,       // Run at most 2 tasks at once\n  emitter: (event) => {\n    if (event === 'ping') {\n      // Try to start a new task\n    } else if (event === 'complete') {\n      console.log('All tasks completed')\n    }\n  },\n})\n\n// Add tasks to the pool\npool.enqueue('task1')\npool.enqueue('task2')\n\n// Get the next task when ready\nconst task1 = pool.next()\nconst task2 = pool.next()\nif (task1) {\n  // Execute the task...\n  // When done:\n  pool.complete(task1)\n}\nconsole.log(task2) // task2\nif (task2) {\n  pool.complete(task2)\n}\nconsole.log(pool.isCompleted()) // true\n"})}),"\n",(0,a.jsx)(s.h2,{id:"types",children:"Types"}),"\n",(0,a.jsx)(s.h3,{id:"taskpooloptions",children:"TaskPoolOptions"}),"\n",(0,a.jsx)(s.p,{children:"Configuration options for TaskPool."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type TaskPoolOptions = {\n  pingInterval?: number;  // Interval in milliseconds to check for available tasks\n  poolSize?: number;      // Maximum number of tasks that can be active simultaneously\n  emitter?: (event: string) => void;  // Function called when pool events occur\n};\n"})}),"\n",(0,a.jsx)(s.h3,{id:"statusfield",children:"StatusField"}),"\n",(0,a.jsx)(s.p,{children:"Type defining valid status field names that can be queried."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type StatusField = 'queued' | 'active' | 'completed' | 'remaining' | 'started' | 'total' | typeof StatusAllField;\n"})}),"\n",(0,a.jsx)(s.h3,{id:"statusrawtype",children:"StatusRawType"}),"\n",(0,a.jsx)(s.p,{children:"Type alias for the raw status type constant."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type StatusRawType = typeof StatusType.RAW;\n"})}),"\n",(0,a.jsx)(s.h3,{id:"statuscounttype",children:"StatusCountType"}),"\n",(0,a.jsx)(s.p,{children:"Type alias for the count status type constant."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type StatusCountType = typeof StatusType.COUNT;\n"})}),"\n",(0,a.jsx)(s.h3,{id:"countstatusresponse",children:"CountStatusResponse"}),"\n",(0,a.jsx)(s.p,{children:"Type for count-based status responses."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type CountStatusResponse = { [K in StatusField]?: number };\n"})}),"\n",(0,a.jsx)(s.h3,{id:"percentstatusresponse",children:"PercentStatusResponse"}),"\n",(0,a.jsx)(s.p,{children:"Type for percentage-based status responses."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type PercentStatusResponse = { [K in StatusField]?: number };\n"})}),"\n",(0,a.jsx)(s.h3,{id:"rawstatus",children:"RawStatus"}),"\n",(0,a.jsx)(s.p,{children:"Type for raw array status responses."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type RawStatus = { [K in StatusField]?: any[] };\n"})}),"\n",(0,a.jsx)(s.h3,{id:"statusresponse",children:"StatusResponse"}),"\n",(0,a.jsx)(s.p,{children:"Union type for all possible status response formats."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"type StatusResponse<T = any> = RawStatus | CountStatusResponse | PercentStatusResponse | T[] | number;\n"})}),"\n",(0,a.jsx)(s.h2,{id:"constants",children:"Constants"}),"\n",(0,a.jsx)(s.h3,{id:"statustype",children:"StatusType"}),"\n",(0,a.jsx)(s.p,{children:"Constants defining the format of status response data."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"const StatusType = {\n  RAW: 'raw',      // Returns raw arrays of task items\n  COUNT: 'count',  // Returns count of task items\n  PERCENT: 3,       // Returns percentages with specified precision\n}\n"})}),"\n",(0,a.jsx)(s.h3,{id:"statusallfield",children:"StatusAllField"}),"\n",(0,a.jsx)(s.p,{children:"Special value used to request all status fields."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"const StatusAllField = '*';\n"})}),"\n",(0,a.jsx)(s.h2,{id:"properties",children:"Properties"}),"\n",(0,a.jsx)(s.h3,{id:"pinginterval",children:"pingInterval"}),"\n",(0,a.jsx)(s.p,{children:"Interval in milliseconds between task availability checks."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"pingInterval: number = 100\n"})}),"\n",(0,a.jsx)(s.h3,{id:"poolsize",children:"poolSize"}),"\n",(0,a.jsx)(s.p,{children:"Maximum number of tasks that can be active simultaneously."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"poolSize: number = 1\n"})}),"\n",(0,a.jsx)(s.h3,{id:"emitter",children:"emitter"}),"\n",(0,a.jsx)(s.p,{children:"Function called when pool events occur ('ping', 'complete', 'startPinging', 'stopPinging')."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"emitter: ((event: string) => void) | undefined\n"})}),"\n",(0,a.jsx)(s.h2,{id:"methods",children:"Methods"}),"\n",(0,a.jsx)(s.h3,{id:"constructor",children:"constructor"}),"\n",(0,a.jsx)(s.p,{children:"Creates a new TaskPool with the specified options."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"constructor(options: TaskPoolOptions)\n"})}),"\n",(0,a.jsx)(s.h4,{id:"parameters",children:"Parameters"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"options"}),": Configuration options for the pool"]}),"\n"]}),"\n",(0,a.jsx)(s.h3,{id:"status",children:"status"}),"\n",(0,a.jsx)(s.p,{children:"Gets status information about the task pool. Provides flexible access to task status information in various formats. Can return raw task arrays, counts, or percentages for any status field."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"status(fields: typeof StatusAllField, type: StatusCountType): CountStatusResponse\nstatus(fields: typeof StatusAllField, type: StatusRawType): RawStatus\nstatus(fields: typeof StatusAllField, type: number): PercentStatusResponse\nstatus(fields: typeof StatusAllField): CountStatusResponse\nstatus(fields: StatusField, type: StatusRawType): T[]\nstatus(fields: StatusField, type: StatusCountType): number\nstatus(fields: StatusField, type: number): number\nstatus(fields: StatusField): number\nstatus(fields: StatusField[], type: StatusRawType): RawStatus\nstatus(fields: StatusField[], type: StatusCountType): CountStatusResponse\nstatus(fields: StatusField[], type: number): PercentStatusResponse\nstatus(fields: StatusField[]): CountStatusResponse\nstatus(): CountStatusResponse\n"})}),"\n",(0,a.jsx)(s.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"fields"}),": Status field(s) to retrieve"]}),"\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"type"}),": Requested return format (raw arrays, counts, or percentages with specified precision)"]}),"\n"]}),"\n",(0,a.jsx)(s.h4,{id:"returns",children:"Returns"}),"\n",(0,a.jsx)(s.p,{children:"Status information in the requested format"}),"\n",(0,a.jsx)(s.h4,{id:"examples",children:"Examples"}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"// Get raw count of tasks in each state\nconst counts = pool.status()\nconsole.log(`${counts.active} tasks running, ${counts.queued} waiting`)\n\n// Get percentage of completed tasks\nconst percent = pool.status('completed', StatusType.PERCENT)\nconsole.log(`${percent}% of tasks completed`)\n\n// Get raw task objects in 'active' state\nconst activeTasks = pool.status('active', StatusType.RAW)\n"})}),"\n",(0,a.jsx)(s.h3,{id:"hasavailableslot",children:"hasAvailableSlot"}),"\n",(0,a.jsx)(s.p,{children:"Checks if the pool has room for another active task."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"hasAvailableSlot(): boolean\n"})}),"\n",(0,a.jsx)(s.h4,{id:"returns-1",children:"Returns"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"boolean"}),": True if another task can be started"]}),"\n"]}),"\n",(0,a.jsx)(s.h3,{id:"isready",children:"isReady"}),"\n",(0,a.jsx)(s.p,{children:"Checks if the pool is ready to process more tasks. A pool is ready when there are queued tasks and an available slot. This method also starts the ping interval if not already running."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"isReady(): boolean\n"})}),"\n",(0,a.jsx)(s.h4,{id:"returns-2",children:"Returns"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"boolean"}),": True if there are queued tasks and an available slot"]}),"\n"]}),"\n",(0,a.jsx)(s.h3,{id:"iscompleted",children:"isCompleted"}),"\n",(0,a.jsx)(s.p,{children:"Checks if all tasks in the pool have been completed."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"isCompleted(emit: boolean = false): boolean\n"})}),"\n",(0,a.jsx)(s.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"emit"}),": (Optional) If true, emits the 'complete' event when all tasks are done. Defaults to false."]}),"\n"]}),"\n",(0,a.jsx)(s.h4,{id:"returns-3",children:"Returns"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"boolean"}),": True if all tasks have been completed"]}),"\n"]}),"\n",(0,a.jsx)(s.h3,{id:"enqueue",children:"enqueue"}),"\n",(0,a.jsx)(s.p,{children:"Adds a task to the queue."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"enqueue(item: T, check: boolean = false): void\n"})}),"\n",(0,a.jsx)(s.h4,{id:"parameters-3",children:"Parameters"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"item"}),": The task to enqueue"]}),"\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"check"}),": (Optional) If true, checks if the item is currently active and removes it. Defaults to false."]}),"\n"]}),"\n",(0,a.jsx)(s.h3,{id:"next",children:"next"}),"\n",(0,a.jsx)(s.p,{children:"Gets the next task from the queue if the pool is ready."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"next(): T | false\n"})}),"\n",(0,a.jsx)(s.h4,{id:"returns-4",children:"Returns"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"T | false"}),": The next task or false if no task is available"]}),"\n"]}),"\n",(0,a.jsx)(s.h3,{id:"complete",children:"complete"}),"\n",(0,a.jsx)(s.p,{children:"Marks a task as complete and moves it from active to completed."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"complete(item: T, check: boolean = true): boolean\n"})}),"\n",(0,a.jsx)(s.h4,{id:"parameters-4",children:"Parameters"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"item"}),": The task to complete"]}),"\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"check"}),": (Optional) If true, verifies the item is currently active. Defaults to true."]}),"\n"]}),"\n",(0,a.jsx)(s.h4,{id:"returns-5",children:"Returns"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"boolean"}),": True if the item was successfully completed"]}),"\n"]}),"\n",(0,a.jsx)(s.h2,{id:"functions",children:"Functions"}),"\n",(0,a.jsx)(s.h3,{id:"round",children:"round"}),"\n",(0,a.jsx)(s.p,{children:"Rounds a number to the specified precision."}),"\n",(0,a.jsx)(s.pre,{children:(0,a.jsx)(s.code,{className:"language-ts",children:"function round(num: number, precision: number = 0): number\n"})}),"\n",(0,a.jsx)(s.h4,{id:"parameters-5",children:"Parameters"}),"\n",(0,a.jsxs)(s.ul,{children:["\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"num"}),": The number to round"]}),"\n",(0,a.jsxs)(s.li,{children:[(0,a.jsx)(s.code,{children:"precision"}),": (Optional) Number of decimal places, defaults to 0"]}),"\n"]}),"\n",(0,a.jsx)(s.h4,{id:"returns-6",children:"Returns"}),"\n",(0,a.jsx)(s.p,{children:"The rounded number"})]})}function u(e={}){const{wrapper:s}={...(0,l.R)(),...e.components};return s?(0,a.jsx)(s,{...e,children:(0,a.jsx)(c,{...e})}):c(e)}}}]);