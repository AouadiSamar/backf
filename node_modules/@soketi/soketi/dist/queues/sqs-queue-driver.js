"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqsQueueDriver = void 0;
const async_1 = require("async");
const sqs_consumer_1 = require("sqs-consumer");
const crypto_1 = require("crypto");
const job_1 = require("../job");
const log_1 = require("../log");
const aws_sdk_1 = require("aws-sdk");
const uuid_1 = require("uuid");
class SqsQueueDriver {
    constructor(server) {
        this.server = server;
        this.queueWithConsumer = new Map();
    }
    addToQueue(queueName, data) {
        return new Promise(resolve => {
            let message = JSON.stringify(data);
            let params = {
                MessageBody: message,
                MessageDeduplicationId: (0, crypto_1.createHash)('sha256').update(message).digest('hex'),
                MessageGroupId: `${data.appId}_${queueName}`,
                QueueUrl: this.server.options.queue.sqs.queueUrl,
            };
            this.sqsClient().sendMessage(params, (err, data) => {
                if (err) {
                    log_1.Log.errorTitle('❎ SQS client could not publish to the queue.');
                    log_1.Log.error({ data, err, params, queueName });
                }
                if (this.server.options.debug && !err) {
                    log_1.Log.successTitle('✅ SQS client publsihed message to the queue.');
                    log_1.Log.success({ data, err, params, queueName });
                }
                resolve();
            });
        });
    }
    processQueue(queueName, callback) {
        return new Promise(resolve => {
            let handleMessage = ({ Body }) => {
                return new Promise(resolve => {
                    callback(new job_1.Job((0, uuid_1.v4)(), JSON.parse(Body)), () => {
                        if (this.server.options.debug) {
                            log_1.Log.successTitle('✅ SQS message processed.');
                            log_1.Log.success({ Body, queueName });
                        }
                        resolve();
                    });
                });
            };
            let consumerOptions = {
                queueUrl: this.server.options.queue.sqs.queueUrl,
                sqs: this.sqsClient(),
                batchSize: this.server.options.queue.sqs.batchSize,
                pollingWaitTimeMs: this.server.options.queue.sqs.pollingWaitTimeMs,
                ...this.server.options.queue.sqs.consumerOptions,
            };
            if (this.server.options.queue.sqs.processBatch) {
                consumerOptions.handleMessageBatch = (messages) => {
                    return Promise.all(messages.map(({ Body }) => handleMessage({ Body }))).then(() => {
                    });
                };
            }
            else {
                consumerOptions.handleMessage = handleMessage;
            }
            let consumer = sqs_consumer_1.Consumer.create(consumerOptions);
            consumer.start();
            this.queueWithConsumer.set(queueName, consumer);
            resolve();
        });
    }
    disconnect() {
        return async_1.default.each([...this.queueWithConsumer], ([queueName, consumer], callback) => {
            if (consumer.isRunning) {
                consumer.stop();
                callback();
            }
        });
    }
    sqsClient() {
        let sqsOptions = this.server.options.queue.sqs;
        return new aws_sdk_1.SQS({
            apiVersion: '2012-11-05',
            region: sqsOptions.region || 'us-east-1',
            endpoint: sqsOptions.endpoint,
            ...sqsOptions.clientOptions,
        });
    }
}
exports.SqsQueueDriver = SqsQueueDriver;
