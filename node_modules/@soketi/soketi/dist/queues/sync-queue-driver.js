"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncQueueDriver = void 0;
const job_1 = require("../job");
const uuid_1 = require("uuid");
class SyncQueueDriver {
    constructor(server) {
        this.server = server;
        this.queues = new Map();
    }
    addToQueue(queueName, data) {
        return new Promise(resolve => {
            let jobCallback = this.queues.get(queueName);
            if (!jobCallback) {
                return resolve();
            }
            let jobId = (0, uuid_1.v4)();
            jobCallback(new job_1.Job(jobId, data), resolve);
        });
    }
    processQueue(queueName, callback) {
        return new Promise(resolve => {
            this.queues.set(queueName, callback);
            resolve();
        });
    }
    disconnect() {
        return Promise.resolve();
    }
}
exports.SyncQueueDriver = SyncQueueDriver;
