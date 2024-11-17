"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookSender = exports.createWebhookHmac = void 0;
const app_1 = require("./app");
const async_1 = require("async");
const axios_1 = require("axios");
const crypto_1 = require("crypto");
const utils_1 = require("./utils");
const aws_sdk_1 = require("aws-sdk");
const log_1 = require("./log");
function createWebhookHmac(data, secret) {
    return (0, crypto_1.createHmac)('sha256', secret)
        .update(data)
        .digest('hex');
}
exports.createWebhookHmac = createWebhookHmac;
class WebhookSender {
    constructor(server) {
        this.server = server;
        this.batch = [];
        this.batchHasLeader = false;
        let queueProcessor = (job, done) => {
            let rawData = job.data;
            const { appKey, payload, originalPusherSignature } = rawData;
            server.appManager.findByKey(appKey).then(app => {
                if (originalPusherSignature !== createWebhookHmac(JSON.stringify(payload), app.secret)) {
                    return;
                }
                async_1.default.each(app.webhooks, (webhook, resolveWebhook) => {
                    var _a;
                    const originalEventsLength = payload.events.length;
                    let filteredPayloadEvents = payload.events;
                    filteredPayloadEvents = filteredPayloadEvents.filter(event => {
                        if (!webhook.event_types.includes(event.name)) {
                            return false;
                        }
                        if (webhook.filter) {
                            if (webhook.filter.channel_name_starts_with && !event.channel.startsWith(webhook.filter.channel_name_starts_with)) {
                                return false;
                            }
                            if (webhook.filter.channel_name_ends_with && !event.channel.endsWith(webhook.filter.channel_name_ends_with)) {
                                return false;
                            }
                        }
                        return true;
                    });
                    if (filteredPayloadEvents.length === 0) {
                        return resolveWebhook();
                    }
                    let pusherSignature = (originalEventsLength !== filteredPayloadEvents.length)
                        ? createWebhookHmac(JSON.stringify(payload), app.secret)
                        : originalPusherSignature;
                    if (this.server.options.debug) {
                        log_1.Log.webhookSenderTitle('🚀 Processing webhook from queue.');
                        log_1.Log.webhookSender({ appKey, payload, pusherSignature });
                    }
                    const headers = {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': `SoketiWebhooksAxiosClient/1.0 (Process: ${this.server.options.instance.process_id})`,
                        ...(_a = webhook.headers) !== null && _a !== void 0 ? _a : {},
                        'X-Pusher-Key': appKey,
                        'X-Pusher-Signature': pusherSignature,
                    };
                    if (webhook.url) {
                        axios_1.default.post(webhook.url, payload, { headers }).then((res) => {
                            if (this.server.options.debug) {
                                log_1.Log.webhookSenderTitle('✅ Webhook sent.');
                                log_1.Log.webhookSender({ webhook, payload });
                            }
                        }).catch(err => {
                            if (this.server.options.debug) {
                                log_1.Log.webhookSenderTitle('❎ Webhook could not be sent.');
                                log_1.Log.webhookSender({ err, webhook, payload });
                            }
                        }).then(() => resolveWebhook());
                    }
                    else if (webhook.lambda_function) {
                        const params = {
                            FunctionName: webhook.lambda_function,
                            InvocationType: webhook.lambda.async ? 'Event' : 'RequestResponse',
                            Payload: Buffer.from(JSON.stringify({ payload, headers })),
                        };
                        let lambda = new aws_sdk_1.Lambda({
                            apiVersion: '2015-03-31',
                            region: webhook.lambda.region || 'us-east-1',
                            ...(webhook.lambda.client_options || {}),
                        });
                        lambda.invoke(params, (err, data) => {
                            if (err) {
                                if (this.server.options.debug) {
                                    log_1.Log.webhookSenderTitle('❎ Lambda trigger failed.');
                                    log_1.Log.webhookSender({ webhook, err, data });
                                }
                            }
                            else {
                                if (this.server.options.debug) {
                                    log_1.Log.webhookSenderTitle('✅ Lambda triggered.');
                                    log_1.Log.webhookSender({ webhook, payload });
                                }
                            }
                            resolveWebhook();
                        });
                    }
                }).then(() => {
                    if (typeof done === 'function') {
                        done();
                    }
                });
            });
        };
        if (server.canProcessQueues()) {
            server.queueManager.processQueue('client_event_webhooks', queueProcessor);
            server.queueManager.processQueue('member_added_webhooks', queueProcessor);
            server.queueManager.processQueue('member_removed_webhooks', queueProcessor);
            server.queueManager.processQueue('channel_vacated_webhooks', queueProcessor);
            server.queueManager.processQueue('channel_occupied_webhooks', queueProcessor);
            server.queueManager.processQueue('cache_miss_webhooks', queueProcessor);
        }
    }
    sendClientEvent(app, channel, event, data, socketId, userId) {
        if (!app.hasClientEventWebhooks) {
            return;
        }
        let formattedData = {
            name: app_1.App.CLIENT_EVENT_WEBHOOK,
            channel,
            event,
            data,
        };
        if (socketId) {
            formattedData.socket_id = socketId;
        }
        if (userId && utils_1.Utils.isPresenceChannel(channel)) {
            formattedData.user_id = userId;
        }
        this.send(app, formattedData, 'client_event_webhooks');
    }
    sendMemberAdded(app, channel, userId) {
        if (!app.hasMemberAddedWebhooks) {
            return;
        }
        this.send(app, {
            name: app_1.App.MEMBER_ADDED_WEBHOOK,
            channel,
            user_id: userId,
        }, 'member_added_webhooks');
    }
    sendMemberRemoved(app, channel, userId) {
        if (!app.hasMemberRemovedWebhooks) {
            return;
        }
        this.send(app, {
            name: app_1.App.MEMBER_REMOVED_WEBHOOK,
            channel,
            user_id: userId,
        }, 'member_removed_webhooks');
    }
    sendChannelVacated(app, channel) {
        if (!app.hasChannelVacatedWebhooks) {
            return;
        }
        this.send(app, {
            name: app_1.App.CHANNEL_VACATED_WEBHOOK,
            channel,
        }, 'channel_vacated_webhooks');
    }
    sendChannelOccupied(app, channel) {
        if (!app.hasChannelOccupiedWebhooks) {
            return;
        }
        this.send(app, {
            name: app_1.App.CHANNEL_OCCUPIED_WEBHOOK,
            channel,
        }, 'channel_occupied_webhooks');
    }
    sendCacheMissed(app, channel) {
        if (!app.hasCacheMissedWebhooks) {
            return;
        }
        this.send(app, {
            name: app_1.App.CACHE_MISSED_WEBHOOK,
            channel,
        }, 'cache_miss_webhooks');
    }
    send(app, data, queueName) {
        if (this.server.options.webhooks.batching.enabled) {
            this.sendWebhookByBatching(app, data, queueName);
        }
        else {
            this.sendWebhook(app, data, queueName);
        }
    }
    sendWebhook(app, data, queueName) {
        let events = data instanceof Array ? data : [data];
        if (events.length === 0) {
            return;
        }
        let time = (new Date).getTime();
        let payload = {
            time_ms: time,
            events,
        };
        let originalPusherSignature = createWebhookHmac(JSON.stringify(payload), app.secret);
        this.server.queueManager.addToQueue(queueName, {
            appKey: app.key,
            appId: app.id,
            payload,
            originalPusherSignature,
        });
    }
    sendWebhookByBatching(app, data, queueName) {
        this.batch.push(data);
        if (!this.batchHasLeader) {
            this.batchHasLeader = true;
            setTimeout(() => {
                if (this.batch.length > 0) {
                    this.sendWebhook(app, this.batch.splice(0, this.batch.length), queueName);
                }
                this.batchHasLeader = false;
            }, this.server.options.webhooks.batching.duration);
        }
    }
}
exports.WebhookSender = WebhookSender;
