/**
 * Normalizes a filename into a string representation.
 *
 * @param {string|URL} f - The filename to normalize
 * @returns {string} The normalized filename
 */
const normalizeFilename = (f) => (f instanceof URL ? f.href : f);
async function importWorkerProxy(filename, options) {
    const { isBrowser = false, isPersistent = false, isSharedWorker = false, executeImmediately = false, terminateKey = 'terminate', WorkerType = Worker, workerFile, workerOptions = {}, workerPromise, messageOptions = { terminate: !isPersistent }, } = options;
    filename = normalizeFilename(filename);
    const module = await import(filename);
    const worker = isPersistent ? new WorkerType(workerFile, (isBrowser ? workerOptions : { ...workerOptions, workerData: { filename } })) : null;
    return new Proxy(module, {
        get(target, prop) {
            if (isPersistent && prop === terminateKey) {
                return isSharedWorker ? () => worker.port.close() : () => worker.terminate();
            }
            const value = target[prop];
            if (value === undefined) {
                return undefined;
            }
            const runWorker = (...args) => {
                const message = typeof value === 'function' ? { filename, method: (prop === 'default' ? prop : value.name), args } : { filename, property: prop };
                const currentWorker = worker || new WorkerType(workerFile, (isBrowser ? workerOptions : { ...workerOptions, workerData: message }));
                return workerPromise(currentWorker, (isBrowser || isPersistent ? message : undefined), messageOptions);
            };
            return executeImmediately ? runWorker : (...args) => () => runWorker(...args);
        },
    });
}

export { importWorkerProxy, normalizeFilename };
