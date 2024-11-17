"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisQueueDriver = void 0;
const async_1 = require("async");
const bullmq_1 = require("bullmq");
const ioredis_1 = require("ioredis");
class RedisQueueDriver {
    constructor(server) {
        this.server = server;
        this.queueWithWorker = new Map();
    }
    addToQueue(queueName, data) {
        return new Promise(resolve => {
            let queueWithWorker = this.queueWithWorker.get(queueName);
            if (!queueWithWorker) {
                return resolve();
            }
            queueWithWorker.queue.add('webhook', data).then(() => resolve());
        });
    }
    processQueue(queueName, callback) {
        return new Promise(resolve => {
            if (!this.queueWithWorker.has(queueName)) {
                let redisOptions = {
                    maxRetriesPerRequest: null,
                    enableReadyCheck: false,
                    ...this.server.options.database.redis,
                    ...this.server.options.queue.redis.redisOptions,
                    keyPrefix: undefined,
                };
                const connection = this.server.options.queue.redis.clusterMode
                    ? new ioredis_1.Cluster(this.server.options.database.redis.clusterNodes, { scaleReads: 'slave', ...redisOptions })
                    : new ioredis_1.default(redisOptions);
                const queueSharedOptions = {
                    prefix: this.server.options.database.redis.keyPrefix.replace(/:$/, ''),
                    connection,
                };
                this.queueWithWorker.set(queueName, {
                    queue: new bullmq_1.Queue(queueName, {
                        ...queueSharedOptions,
                        defaultJobOptions: {
                            attempts: 6,
                            backoff: {
                                type: 'exponential',
                                delay: 1000,
                            },
                            removeOnComplete: true,
                            removeOnFail: true,
                        },
                    }),
                    worker: new bullmq_1.Worker(queueName, callback, {
                        ...queueSharedOptions,
                        concurrency: this.server.options.queue.redis.concurrency,
                    }),
                    scheduler: new bullmq_1.QueueScheduler(queueName, queueSharedOptions),
                });
            }
            resolve();
        });
    }
    disconnect() {
        return async_1.default.each([...this.queueWithWorker], ([queueName, { queue, worker, scheduler }], callback) => {
            scheduler.close().then(() => {
                worker.close().then(() => callback());
            });
        });
    }
}
exports.RedisQueueDriver = RedisQueueDriver;
