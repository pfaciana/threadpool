/**
 * Web Worker implementation for @renderdev/threadpool
 *
 * This script runs inside the Web Worker and handles communication with the main thread.
 * It imports modules requested by the main thread and executes their methods or returns
 * their properties, then sends the results back to the main thread.
 *
 * This file works with both DedicatedWorker and SharedWorker implementations.
 *
 * @module worker-thread
 * @private
 */
/**
 * Creates a message handler function for processing requests from the main thread.
 *
 * @param {MessagePort|Worker} port - The port to use for sending responses back to main thread
 * @returns {Function} Message handler function
 * @private
 */
const sendMessage = (port) => async (event) => {
    const { filename, property, method, args } = event.data;
    const imported = await import(filename);
    try {
        // Handle property access request
        if (property) {
            port.postMessage(imported[property]);
        }
        // Handle method call request
        if (method) {
            port.postMessage(await imported[method](...(args || [])));
        }
    }
    catch (error) {
        port.postMessage({ error: error.message });
    }
};
// Set up appropriate event handlers based on worker type
if (!!self.DedicatedWorkerGlobalScope) {
    // DedicatedWorker setup
    self.addEventListener('message', sendMessage(self));
}
else if (!!self.SharedWorkerGlobalScope) {
    // SharedWorker setup
    self.addEventListener('connect', (event) => {
        const { ports } = event;
        ports[0].addEventListener('message', sendMessage(ports[0]));
        ports[0].start();
    });
}
export {};
