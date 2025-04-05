"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[8307],{3331:(e,r,n)=>{n.d(r,{R:()=>o,x:()=>a});var t=n(8101);const s={},i=t.createContext(s);function o(e){const r=t.useContext(i);return t.useMemo((function(){return"function"==typeof e?e(r):{...r,...e}}),[r,e])}function a(e){let r;return r=e.disableParentContext?"function"==typeof e.components?e.components(s):e.components||s:o(e.components),t.createElement(i.Provider,{value:r},e.children)}},9705:(e,r,n)=>{n.r(r),n.d(r,{assets:()=>l,contentTitle:()=>a,default:()=>h,frontMatter:()=>o,metadata:()=>t,toc:()=>d});const t=JSON.parse('{"id":"api/web/main-thread","title":"Web Worker Import Functions","description":"Functions for importing modules to run in web workers. These functions provide different approaches for executing code in separate web worker threads, with varying levels of persistence and interaction patterns.","source":"@site/docs/api/web/main-thread.md","sourceDirName":"api/web","slug":"/api/web/main-thread","permalink":"/threadpool/docs/api/web/main-thread","draft":false,"unlisted":false,"editUrl":"https://github.com/pfaciana/threadpool/tree/master/docs/docs/api/web/main-thread.md","tags":[],"version":"current","sidebarPosition":3,"frontMatter":{"sidebar_position":3},"sidebar":"tutorialSidebar","previous":{"title":"WebFunctionPool","permalink":"/threadpool/docs/api/web/function-pool"},"next":{"title":"Examples","permalink":"/threadpool/docs/category/examples"}}');var s=n(5105),i=n(3331);const o={sidebar_position:3},a="Web Worker Import Functions",l={},d=[{value:"Types",id:"types",level:2},{value:"WorkerOptions",id:"workeroptions",level:3},{value:"Functions",id:"functions",level:2},{value:"setWorkerUrl",id:"setworkerurl",level:3},{value:"Parameters",id:"parameters",level:4},{value:"Example",id:"example",level:4},{value:"getWorkerUrl",id:"getworkerurl",level:3},{value:"Returns",id:"returns",level:4},{value:"Example",id:"example-1",level:4},{value:"importTaskWebWorker",id:"importtaskwebworker",level:3},{value:"Type Parameters",id:"type-parameters",level:4},{value:"Parameters",id:"parameters-1",level:4},{value:"Returns",id:"returns-1",level:4},{value:"Example",id:"example-2",level:4},{value:"importWebWorker",id:"importwebworker",level:3},{value:"Type Parameters",id:"type-parameters-1",level:4},{value:"Parameters",id:"parameters-2",level:4},{value:"Returns",id:"returns-2",level:4},{value:"Example",id:"example-3",level:4},{value:"importPersistentWebWorker",id:"importpersistentwebworker",level:3},{value:"Type Parameters",id:"type-parameters-2",level:4},{value:"Parameters",id:"parameters-3",level:4},{value:"Returns",id:"returns-3",level:4},{value:"Example",id:"example-4",level:4},{value:"Example with SharedWorker",id:"example-with-sharedworker",level:4}];function c(e){const r={code:"code",h1:"h1",h2:"h2",h3:"h3",h4:"h4",header:"header",li:"li",p:"p",pre:"pre",ul:"ul",...(0,i.R)(),...e.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(r.header,{children:(0,s.jsx)(r.h1,{id:"web-worker-import-functions",children:"Web Worker Import Functions"})}),"\n",(0,s.jsx)(r.p,{children:"Functions for importing modules to run in web workers. These functions provide different approaches for executing code in separate web worker threads, with varying levels of persistence and interaction patterns."}),"\n",(0,s.jsx)(r.h2,{id:"types",children:"Types"}),"\n",(0,s.jsx)(r.h3,{id:"workeroptions",children:"WorkerOptions"}),"\n",(0,s.jsx)(r.p,{children:"Web Worker options interface from the DOM API."}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"interface WorkerOptions {\n  type?: 'classic' | 'module';\n  credentials?: 'include' | 'omit' | 'same-origin';\n  name?: string;\n}\n"})}),"\n",(0,s.jsx)(r.h2,{id:"functions",children:"Functions"}),"\n",(0,s.jsx)(r.h3,{id:"setworkerurl",children:"setWorkerUrl"}),"\n",(0,s.jsx)(r.p,{children:"Sets the URL for the worker script. This allows customizing the worker script location rather than using the default inline data URL."}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"function setWorkerUrl(filename: URL | string): void\n"})}),"\n",(0,s.jsx)(r.h4,{id:"parameters",children:"Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"filename"}),": URL or string path to the worker script"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"example",children:"Example"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"// Use a custom worker script\nsetWorkerUrl(new URL('./my-worker.js', import.meta.url))\n\n// Later worker imports will use this custom script\nconst worker = await importWebWorker('./math.js')\n"})}),"\n",(0,s.jsx)(r.h3,{id:"getworkerurl",children:"getWorkerUrl"}),"\n",(0,s.jsx)(r.p,{children:"Gets the currently set worker URL or falls back to the default data URL."}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"function getWorkerUrl(): URL | string\n"})}),"\n",(0,s.jsx)(r.h4,{id:"returns",children:"Returns"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsx)(r.li,{children:"The current worker URL or data URL if none is set"}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"example-1",children:"Example"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"// Check which worker script is currently in use\nconst workerUrl = getWorkerUrl()\nconsole.log('Using worker script at:', workerUrl)\n"})}),"\n",(0,s.jsx)(r.h3,{id:"importtaskwebworker",children:"importTaskWebWorker"}),"\n",(0,s.jsx)(r.p,{children:"Imports a module as a one-time task in a Web Worker. The worker is terminated after a single property access or method call. No further interaction with the module is possible after the request."}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"function importTaskWebWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<DeferredPromisifyModule<T>>\n"})}),"\n",(0,s.jsx)(r.h4,{id:"type-parameters",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"T"}),": Type of the module being imported"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-1",children:"Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"filename"}),": Path to the module to import in the worker"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"workerOptions"}),": (Optional) Options for the Worker constructor"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"messageOptions"}),": (Optional) Options for message handling"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"returns-1",children:"Returns"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsx)(r.li,{children:"Promise for the deferred module proxy"}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"example-2",children:"Example"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"// Import a module with math functions\nimport type * as MathModule from './math.js'\n\n// Create a Function Worker Pool\nconst pool = new FunctionPool()\n\n// Calculate fibonacci in a worker and get result without persisting the worker\nconst { fib } = await importTaskWebWorker<typeof MathModule>('./math.js')\n\n// Instead of passing a task function that calls await fib(42),\n// importTaskWorker automatically wraps the method so it's run as a worker\npool.addTask(fib(42))\n\n// vs.\nconst { fib: fib2 } = await importWebWorker<typeof MathModule>('./math.js')\npool.addTask(() => fib2(42))\n// both lines of code do the same thing!\n"})}),"\n",(0,s.jsx)(r.h3,{id:"importwebworker",children:"importWebWorker"}),"\n",(0,s.jsx)(r.p,{children:"Imports a module in a Web Worker and immediately executes all exported methods. The worker is terminated after any method call. This is useful for one-off computations where you want to immediately execute a function."}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"function importWebWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<PromisifyModule<T>>\n"})}),"\n",(0,s.jsx)(r.h4,{id:"type-parameters-1",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"T"}),": Type of the module being imported"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-2",children:"Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"filename"}),": Path to the module to import in the worker"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"workerOptions"}),": (Optional) Options for the Worker constructor"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"messageOptions"}),": (Optional) Options for message handling"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"returns-2",children:"Returns"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsx)(r.li,{children:"Promise for the immediate-execution module proxy"}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"example-3",children:"Example"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"// Import a module with math functions\nimport type * as MathModule from './math.js'\n\n// This will create a worker, execute fib(40), and terminate the worker\nconst { fib } = await importWebWorker<typeof MathModule>('./math.js')\nconsole.log(await fib(42)) // 267914296\n\n// Each call creates a new worker\nconst sum = await importWebWorker<typeof MathModule>('./math.js').add(5, 10)\n"})}),"\n",(0,s.jsx)(r.h3,{id:"importpersistentwebworker",children:"importPersistentWebWorker"}),"\n",(0,s.jsx)(r.p,{children:"Imports a module in a persistent Web Worker. The worker remains active until manually terminated, allowing for multiple method calls and stateful interactions with the module."}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"function importPersistentWebWorker<T>(filename: string | URL, workerOptions?: WorkerOptions, messageOptions?: MessageOptions): Promise<PromisifyModule<T & Terminable>>\n"})}),"\n",(0,s.jsx)(r.h4,{id:"type-parameters-2",children:"Type Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"T"}),": Type of the module being imported"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"parameters-3",children:"Parameters"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"filename"}),": Path to the module to import in the worker"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"workerOptions"}),": (Optional) Options for the Worker constructor"]}),"\n",(0,s.jsxs)(r.li,{children:[(0,s.jsx)(r.code,{children:"messageOptions"}),": (Optional) Options for message handling"]}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"returns-3",children:"Returns"}),"\n",(0,s.jsxs)(r.ul,{children:["\n",(0,s.jsx)(r.li,{children:"Promise for the persistent module proxy with terminate method"}),"\n"]}),"\n",(0,s.jsx)(r.h4,{id:"example-4",children:"Example"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"// Import a module with math functions\nimport type * as MathModule from './math.js'\n\n// Create a persistent worker that keeps state between calls\nconst math = await importPersistentWebWorker<typeof MathModule>('./math.js')\n\n// First calculation\nconst result1 = await math.add(1, 2\n\n// Second calculation using the same worker\nconst result2 = await math.multiply(result1)\n\n// Terminate when done\nmath.terminat()\n"})}),"\n",(0,s.jsx)(r.h4,{id:"example-with-sharedworker",children:"Example with SharedWorker"}),"\n",(0,s.jsx)(r.pre,{children:(0,s.jsx)(r.code,{className:"language-ts",children:"// Use with a SharedWorker\nconst sharedMath = await importPersistentWebWorker('./math.js', {}, {\n  WorkerType: SharedWorker,\n  name: 'shared-math-worker',\n})\n\n// Multiple scripts can now access the same worker\nconst result = await sharedMath.add(10, 20)\n"})})]})}function h(e={}){const{wrapper:r}={...(0,i.R)(),...e.components};return r?(0,s.jsx)(r,{...e,children:(0,s.jsx)(c,{...e})}):c(e)}}}]);