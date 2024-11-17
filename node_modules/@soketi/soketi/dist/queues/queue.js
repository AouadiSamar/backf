"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
const log_1 = require("../log");
const redis_queue_driver_1 = require("./redis-queue-driver");
const sqs_queue_driver_1 = require("./sqs-queue-driver");
const sync_queue_driver_1 = require("./sync-queue-driver");
class Queue {
    constructor(server) {
        this.server = server;
        if (server.options.queue.driver === 'sync') {
            this.driver = new sync_queue_driver_1.SyncQueueDriver(server);
        }
        else if (server.options.queue.driver === 'redis') {
            this.driver = new redis_queue_driver_1.RedisQueueDriver(server);
        }
        else if (server.options.queue.driver === 'sqs') {
            this.driver = new sqs_queue_driver_1.SqsQueueDriver(server);
        }
        else {
            log_1.Log.error('No valid queue driver specified.');
        }
    }
    addToQueue(queueName, data) {
        return this.driver.addToQueue(queueName, data);
    }
    processQueue(queueName, callback) {
        return this.driver.processQueue(queueName, callback);
    }
    disconnect() {
        return this.driver.disconnect();
    }
}
exports.Queue = Queue;
