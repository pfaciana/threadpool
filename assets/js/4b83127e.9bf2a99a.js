"use strict";(self.webpackChunkdocs=self.webpackChunkdocs||[]).push([[2027],{8148:e=>{e.exports=JSON.parse('{"version":{"pluginId":"default","version":"current","label":"Next","banner":null,"badge":false,"noIndex":false,"className":"docs-version-current","isLast":true,"docsSidebars":{"tutorialSidebar":[{"type":"category","label":"Getting Started","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Installation","href":"/threadpool/docs/getting-started/installation","docId":"getting-started/installation","unlisted":false},{"type":"link","label":"Core Concepts","href":"/threadpool/docs/getting-started/core-concepts","docId":"getting-started/core-concepts","unlisted":false}],"href":"/threadpool/docs/category/getting-started"},{"type":"category","label":"API Reference","collapsible":true,"collapsed":true,"items":[{"type":"category","label":"Core API","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"ThreadStatus","href":"/threadpool/docs/api/core/thread-status","docId":"api/core/thread-status","unlisted":false},{"type":"link","label":"TaskPool","href":"/threadpool/docs/api/core/pool-status","docId":"api/core/pool-status","unlisted":false}],"href":"/threadpool/docs/category/core-api"},{"type":"category","label":"Worker API","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"WorkerThread","href":"/threadpool/docs/api/node/worker-thread","docId":"api/node/worker-thread","unlisted":false},{"type":"link","label":"WorkerPool","href":"/threadpool/docs/api/node/worker-pool","docId":"api/node/worker-pool","unlisted":false},{"type":"link","label":"Worker","href":"/threadpool/docs/api/node/worker","docId":"api/node/worker","unlisted":false},{"type":"link","label":"Exit Event Support","href":"/threadpool/docs/api/node/exit-event-support","docId":"api/node/exit-event-support","unlisted":false}],"href":"/threadpool/docs/category/worker-api"},{"type":"category","label":"Function API","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"FunctionThread","href":"/threadpool/docs/api/function/function-thread","docId":"api/function/function-thread","unlisted":false},{"type":"link","label":"FunctionPool","href":"/threadpool/docs/api/function/function-pool","docId":"api/function/function-pool","unlisted":false},{"type":"link","label":"Worker Import Functions","href":"/threadpool/docs/api/function/main-thread","docId":"api/function/main-thread","unlisted":false}],"href":"/threadpool/docs/category/function-api"},{"type":"category","label":"Web API","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"WebFunctionThread","href":"/threadpool/docs/api/web/function-thread","docId":"api/web/function-thread","unlisted":false},{"type":"link","label":"WebFunctionPool","href":"/threadpool/docs/api/web/function-pool","docId":"api/web/function-pool","unlisted":false},{"type":"link","label":"Web Worker Import Functions","href":"/threadpool/docs/api/web/main-thread","docId":"api/web/main-thread","unlisted":false}],"href":"/threadpool/docs/category/web-api"}],"href":"/threadpool/docs/category/api-reference"},{"type":"category","label":"Examples","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Base Module","href":"/threadpool/docs/examples/math-module","docId":"examples/math-module","unlisted":false},{"type":"category","label":"Node Worker","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Basic Worker","href":"/threadpool/docs/examples/node/math-worker","docId":"examples/node/math-worker","unlisted":false}],"href":"/threadpool/docs/category/node-worker"},{"type":"category","label":"Server Functions","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Basic Worker","href":"/threadpool/docs/examples/function/math","docId":"examples/function/math","unlisted":false},{"type":"link","label":"Multiple Workers","href":"/threadpool/docs/examples/function/pool","docId":"examples/function/pool","unlisted":false},{"type":"link","label":"Persistent Workers","href":"/threadpool/docs/examples/function/persistent-worker","docId":"examples/function/persistent-worker","unlisted":false}],"href":"/threadpool/docs/category/server-functions"},{"type":"category","label":"Web Functions","collapsible":true,"collapsed":true,"items":[{"type":"link","label":"Web Workers","href":"/threadpool/docs/examples/web/web-examples","docId":"examples/web/web-examples","unlisted":false}],"href":"/threadpool/docs/category/web-functions"}],"href":"/threadpool/docs/category/examples"}]},"docs":{"api/core/pool-status":{"id":"api/core/pool-status","title":"TaskPool","description":"Manages a pool of tasks with queuing and status tracking. Provides a system for managing concurrent tasks, limiting the number of simultaneously active tasks, and tracking task states as they move through the queue.","sidebar":"tutorialSidebar"},"api/core/thread-status":{"id":"api/core/thread-status","title":"ThreadStatus","description":"Tracks the state of a thread throughout its lifecycle using bitwise flags to efficiently represent and check multiple states. Provides convenient boolean accessors for checking specific states.","sidebar":"tutorialSidebar"},"api/function/function-pool":{"id":"api/function/function-pool","title":"FunctionPool","description":"Manages a pool of FunctionThread instances for parallel execution.","sidebar":"tutorialSidebar"},"api/function/function-thread":{"id":"api/function/function-thread","title":"FunctionThread","description":"Manages a function-based thread with state tracking and event handling.","sidebar":"tutorialSidebar"},"api/function/main-thread":{"id":"api/function/main-thread","title":"Worker Import Functions","description":"Functions for importing modules to run in worker threads. These functions provide different approaches for executing code in separate threads, with varying levels of persistence and interaction patterns.","sidebar":"tutorialSidebar"},"api/node/exit-event-support":{"id":"api/node/exit-event-support","title":"Exit Event Support","description":"The exit event support utilities provide tools for handling worker thread termination across different JavaScript runtimes (Node.js, Deno, and Bun). These utilities help ensure consistent worker cleanup behavior regardless of the runtime environment.","sidebar":"tutorialSidebar"},"api/node/worker":{"id":"api/node/worker","title":"Worker","description":"Enhanced Worker implementation that extends Node.js worker_threads.Worker. This class adds environment variable sharing across different Node.js runtime environments, exit event fallback for environments where worker exit events aren\'t natively supported, and better cross-runtime compatibility (Node.js, Deno, Bun).","sidebar":"tutorialSidebar"},"api/node/worker-pool":{"id":"api/node/worker-pool","title":"WorkerPool","description":"Manages a pool of worker threads for parallel execution. WorkerPool provides a high-level API for managing multiple worker threads in Node.js, automatically handling queuing, execution, and resource monitoring. It offers Promise-like APIs and combinators for working with multiple concurrent worker tasks.","sidebar":"tutorialSidebar"},"api/node/worker-thread":{"id":"api/node/worker-thread","title":"WorkerThread","description":"Manages a worker thread lifecycle with state tracking and event handling. WorkerThread provides a higher-level API on top of Node.js worker_threads, handling thread lifecycle management, state tracking, and offering a Promise-like API for working with worker results.","sidebar":"tutorialSidebar"},"api/web/function-pool":{"id":"api/web/function-pool","title":"WebFunctionPool","description":"Manages a pool of WebFunctionThread instances for parallel execution. WebFunctionPool provides a high-level API for managing multiple function-based threads, automatically handling queuing, execution and event propagation. It offers Promise-like APIs and combinators for working with multiple concurrent tasks.","sidebar":"tutorialSidebar"},"api/web/function-thread":{"id":"api/web/function-thread","title":"WebFunctionThread","description":"Manages a function-based thread in web environments. WebFunctionThread wraps an asynchronous function with thread-like status tracking and eventing capabilities, allowing it to be managed similar to actual web workers but without the overhead of creating separate worker threads.","sidebar":"tutorialSidebar"},"api/web/main-thread":{"id":"api/web/main-thread","title":"Web Worker Import Functions","description":"Functions for importing modules to run in web workers. These functions provide different approaches for executing code in separate web worker threads, with varying levels of persistence and interaction patterns.","sidebar":"tutorialSidebar"},"examples/function/math":{"id":"examples/function/math","title":"Basic Worker","description":"This example demonstrates how to use the FunctionPool to execute CPU-intensive math operations concurrently, improving performance on multi-core systems.","sidebar":"tutorialSidebar"},"examples/function/persistent-worker":{"id":"examples/function/persistent-worker","title":"Persistent Workers","description":"Basic Independent Workers","sidebar":"tutorialSidebar"},"examples/function/pool":{"id":"examples/function/pool","title":"Multiple Workers","description":"1# Multiple Workers","sidebar":"tutorialSidebar"},"examples/math-module":{"id":"examples/math-module","title":"Base Module","description":"Throughout the examples in this documentation, we will be using this math module to demonstrate various concepts.","sidebar":"tutorialSidebar"},"examples/node/math-worker":{"id":"examples/node/math-worker","title":"Basic Worker","description":"This example demonstrates how to use the WorkerPool in a Node.js environment to execute CPU-intensive math operations concurrently.","sidebar":"tutorialSidebar"},"examples/web/web-examples":{"id":"examples/web/web-examples","title":"Web Worker Examples","description":"This section demonstrates how to use @renderdev/threadpool in web browser environments. These examples showcase how to leverage ThreadPool\'s API for both dedicated and shared Web Workers.","sidebar":"tutorialSidebar"},"getting-started/core-concepts":{"id":"getting-started/core-concepts","title":"Core Concepts","description":"The sole purpose of this library is to make working with Node and Web Workers simpler and remove boilerplate code for common tasks.","sidebar":"tutorialSidebar"},"getting-started/installation":{"id":"getting-started/installation","title":"Installation","description":"Installation Methods","sidebar":"tutorialSidebar"}}}}')}}]);