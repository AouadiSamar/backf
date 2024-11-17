"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpHandler = void 0;
const async_1 = require("async");
const utils_1 = require("./utils");
const log_1 = require("./log");
const v8 = require('v8');
class HttpHandler {
    constructor(server) {
        this.server = server;
    }
    ready(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
        ]).then(res => {
            if (this.server.closing) {
                this.serverErrorResponse(res, 'The server is closing. Choose another server. :)');
            }
            else {
                this.send(res, 'OK');
            }
        });
    }
    acceptTraffic(res) {
        this.attachMiddleware(res, [
            this.corsMiddleware,
        ]).then(res => {
            if (this.server.closing) {
                return this.serverErrorResponse(res, 'The server is closing. Choose another server. :)');
            }
            let threshold = this.server.options.httpApi.acceptTraffic.memoryThreshold;
            let { rss, heapTotal, external, arrayBuffers, } = process.memoryUsage();
            let totalSize = v8.getHeapStatistics().total_available_size;
            let usedSize = rss + heapTotal + external + arrayBuffers;
            let percentUsage = (usedSize / totalSize) * 100;
            if (threshold < percentUsage) {
                return this.serverErrorResponse(res, 'Low on memory here. Choose another server. :)');
            }
            this.sendJson(res, {
                memory: {
                    usedSize,
                    totalSize,
                    percentUsage,
                },
            });
        });
    }
    healthCheck(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
        ]).then(res => {
            this.send(res, 'OK');
        });
    }
    usage(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
        ]).then(res => {
            let { rss, heapTotal, external, arrayBuffers, } = process.memoryUsage();
            let totalSize = v8.getHeapStatistics().total_available_size;
            let usedSize = rss + heapTotal + external + arrayBuffers;
            let freeSize = totalSize - usedSize;
            let percentUsage = (usedSize / totalSize) * 100;
            return this.sendJson(res, {
                memory: {
                    free: freeSize,
                    used: usedSize,
                    total: totalSize,
                    percent: percentUsage,
                },
            });
        });
    }
    metrics(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
        ]).then(res => {
            let handleError = err => {
                this.serverErrorResponse(res, 'A server error has occurred.');
            };
            if (res.query.json) {
                this.server.metricsManager
                    .getMetricsAsJson()
                    .then(metrics => {
                    this.sendJson(res, metrics);
                })
                    .catch(handleError);
            }
            else {
                this.server.metricsManager
                    .getMetricsAsPlaintext()
                    .then(metrics => {
                    this.send(res, metrics);
                })
                    .catch(handleError);
            }
        });
    }
    channels(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
            this.appMiddleware,
            this.authMiddleware,
            this.readRateLimitingMiddleware,
        ]).then(res => {
            this.server.adapter.getChannelsWithSocketsCount(res.params.appId).then(channels => {
                let response = [...channels].reduce((channels, [channel, connections]) => {
                    if (connections === 0) {
                        return channels;
                    }
                    if (res.query.filter_by_prefix && !channel.startsWith(res.query.filter_by_prefix)) {
                        return channels;
                    }
                    channels[channel] = {
                        subscription_count: connections,
                        occupied: true,
                    };
                    return channels;
                }, {});
                return response;
            }).catch(err => {
                log_1.Log.error(err);
                return this.serverErrorResponse(res, 'A server error has occurred.');
            }).then(channels => {
                let broadcastMessage = { channels };
                this.server.metricsManager.markApiMessage(res.params.appId, {}, broadcastMessage);
                this.sendJson(res, broadcastMessage);
            });
        });
    }
    channel(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
            this.appMiddleware,
            this.authMiddleware,
            this.readRateLimitingMiddleware,
        ]).then(res => {
            let response;
            this.server.adapter.getChannelSocketsCount(res.params.appId, res.params.channel).then(socketsCount => {
                response = {
                    subscription_count: socketsCount,
                    occupied: socketsCount > 0,
                };
                if (res.params.channel.startsWith('presence-')) {
                    response.user_count = 0;
                    if (response.subscription_count > 0) {
                        this.server.adapter.getChannelMembersCount(res.params.appId, res.params.channel).then(membersCount => {
                            let broadcastMessage = {
                                ...response,
                                ...{
                                    user_count: membersCount,
                                },
                            };
                            this.server.metricsManager.markApiMessage(res.params.appId, {}, broadcastMessage);
                            this.sendJson(res, broadcastMessage);
                        }).catch(err => {
                            log_1.Log.error(err);
                            return this.serverErrorResponse(res, 'A server error has occurred.');
                        });
                        return;
                    }
                }
                this.server.metricsManager.markApiMessage(res.params.appId, {}, response);
                return this.sendJson(res, response);
            }).catch(err => {
                log_1.Log.error(err);
                return this.serverErrorResponse(res, 'A server error has occurred.');
            });
        });
    }
    channelUsers(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.corsMiddleware,
            this.appMiddleware,
            this.authMiddleware,
            this.readRateLimitingMiddleware,
        ]).then(res => {
            if (!res.params.channel.startsWith('presence-')) {
                return this.badResponse(res, 'The channel must be a presence channel.');
            }
            this.server.adapter.getChannelMembers(res.params.appId, res.params.channel).then(members => {
                let broadcastMessage = {
                    users: [...members].map(([user_id, user_info]) => {
                        return res.query.with_user_info === '1'
                            ? { id: user_id, user_info }
                            : { id: user_id };
                    }),
                };
                this.server.metricsManager.markApiMessage(res.params.appId, {}, broadcastMessage);
                this.sendJson(res, broadcastMessage);
            });
        });
    }
    events(res) {
        this.attachMiddleware(res, [
            this.corkMiddleware,
            this.jsonBodyMiddleware,
            this.corsMiddleware,
            this.appMiddleware,
            this.authMiddleware,
            this.broadcastEventRateLimitingMiddleware,
        ]).then(res => {
            this.checkMessageToBroadcast(res.body, res.app).then(message => {
                this.broadcastMessage(message, res.app.id);
                this.server.metricsManager.markApiMessage(res.app.id, res.body, { ok: true });
                this.sendJson(res, { ok: true });
            }).catch(error => {
                if (error.code === 400) {
                    this.badResponse(res, error.message);
                }
                else if (error.code === 413) {
                    this.entityTooLargeResponse(res, error.message);
                }
            });
        });
    }
    batchEvents(res) {
        this.attachMiddleware(res, [
            this.jsonBodyMiddleware,
            this.corsMiddleware,
            this.appMiddleware,
            this.authMiddleware,
            this.broadcastBatchEventsRateLimitingMiddleware,
        ]).then(res => {
            let batch = res.body.batch;
            if (batch.length > res.app.maxEventBatchSize) {
                return this.badResponse(res, `Cannot batch-send more than ${res.app.maxEventBatchSize} messages at once`);
            }
            Promise.all(batch.map(message => this.checkMessageToBroadcast(message, res.app))).then(messages => {
                messages.forEach(message => this.broadcastMessage(message, res.app.id));
                this.server.metricsManager.markApiMessage(res.app.id, res.body, { ok: true });
                this.sendJson(res, { ok: true });
            }).catch((error) => {
                if (error.code === 400) {
                    this.badResponse(res, error.message);
                }
                else if (error.code === 413) {
                    this.entityTooLargeResponse(res, error.message);
                }
            });
        });
    }
    terminateUserConnections(res) {
        this.attachMiddleware(res, [
            this.jsonBodyMiddleware,
            this.corsMiddleware,
            this.appMiddleware,
            this.authMiddleware,
        ]).then(res => {
            this.server.adapter.terminateUserConnections(res.app.id, res.params.userId);
            this.sendJson(res, { ok: true });
        });
    }
    checkMessageToBroadcast(message, app) {
        return new Promise((resolve, reject) => {
            if ((!message.channels && !message.channel) ||
                !message.name ||
                !message.data) {
                return reject({
                    message: 'The received data is incorrect',
                    code: 400,
                });
            }
            let channels = message.channels || [message.channel];
            message.channels = channels;
            if (channels.length > app.maxEventChannelsAtOnce) {
                return reject({
                    message: `Cannot broadcast to more than ${app.maxEventChannelsAtOnce} channels at once`,
                    code: 400,
                });
            }
            if (message.name.length > app.maxEventNameLength) {
                return reject({
                    message: `Event name is too long. Maximum allowed size is ${app.maxEventNameLength}.`,
                    code: 400,
                });
            }
            let payloadSizeInKb = utils_1.Utils.dataToKilobytes(message.data);
            if (payloadSizeInKb > parseFloat(app.maxEventPayloadInKb)) {
                return reject({
                    message: `The event data should be less than ${app.maxEventPayloadInKb} KB.`,
                    code: 413,
                });
            }
            resolve(message);
        });
    }
    broadcastMessage(message, appId) {
        message.channels.forEach(channel => {
            let msg = {
                event: message.name,
                channel,
                data: message.data,
            };
            this.server.adapter.send(appId, channel, JSON.stringify(msg), message.socket_id);
            if (utils_1.Utils.isCachingChannel(channel)) {
                this.server.cacheManager.set(`app:${appId}:channel:${channel}:cache_miss`, JSON.stringify({ event: msg.event, data: msg.data }), this.server.options.channelLimits.cacheTtl);
            }
        });
    }
    notFound(res) {
        try {
            res.writeStatus('404 Not Found');
            this.attachMiddleware(res, [
                this.corkMiddleware,
                this.corsMiddleware,
            ]).then(res => {
                this.send(res, '', '404 Not Found');
            });
        }
        catch (e) {
            log_1.Log.warningTitle('Response could not be sent');
            log_1.Log.warning(e);
        }
    }
    badResponse(res, error) {
        return this.sendJson(res, { error, code: 400 }, '400 Invalid Request');
    }
    notFoundResponse(res, error) {
        return this.sendJson(res, { error, code: 404 }, '404 Not Found');
    }
    unauthorizedResponse(res, error) {
        return this.sendJson(res, { error, code: 401 }, '401 Authorization Required');
    }
    entityTooLargeResponse(res, error) {
        return this.sendJson(res, { error, code: 413 }, '413 Payload Too Large');
    }
    tooManyRequestsResponse(res) {
        return this.sendJson(res, { error: 'Too many requests.', code: 429 }, '429 Too Many Requests');
    }
    serverErrorResponse(res, error) {
        return this.sendJson(res, { error, code: 500 }, '500 Internal Server Error');
    }
    jsonBodyMiddleware(res, next) {
        this.readJson(res, (body, rawBody) => {
            res.body = body;
            res.rawBody = rawBody;
            let requestSizeInMb = utils_1.Utils.dataToMegabytes(rawBody);
            if (requestSizeInMb > this.server.options.httpApi.requestLimitInMb) {
                return this.entityTooLargeResponse(res, 'The payload size is too big.');
            }
            next(null, res);
        }, err => {
            return this.badResponse(res, 'The received data is incorrect.');
        });
    }
    corkMiddleware(res, next) {
        res.cork(() => next(null, res));
    }
    corsMiddleware(res, next) {
        res.writeHeader('Access-Control-Allow-Origin', this.server.options.cors.origin.join(', '));
        res.writeHeader('Access-Control-Allow-Methods', this.server.options.cors.methods.join(', '));
        res.writeHeader('Access-Control-Allow-Headers', this.server.options.cors.allowedHeaders.join(', '));
        next(null, res);
    }
    appMiddleware(res, next) {
        return this.server.appManager.findById(res.params.appId).then(validApp => {
            if (!validApp) {
                return this.notFoundResponse(res, `The app ${res.params.appId} could not be found.`);
            }
            res.app = validApp;
            next(null, res);
        });
    }
    authMiddleware(res, next) {
        this.signatureIsValid(res).then(valid => {
            if (valid) {
                return next(null, res);
            }
            return this.unauthorizedResponse(res, 'The secret authentication failed');
        });
    }
    readRateLimitingMiddleware(res, next) {
        this.server.rateLimiter.consumeReadRequestsPoints(1, res.app).then(response => {
            if (response.canContinue) {
                for (let header in response.headers) {
                    res.writeHeader(header, '' + response.headers[header]);
                }
                return next(null, res);
            }
            this.tooManyRequestsResponse(res);
        });
    }
    broadcastEventRateLimitingMiddleware(res, next) {
        let channels = res.body.channels || [res.body.channel];
        this.server.rateLimiter.consumeBackendEventPoints(Math.max(channels.length, 1), res.app).then(response => {
            if (response.canContinue) {
                for (let header in response.headers) {
                    res.writeHeader(header, '' + response.headers[header]);
                }
                return next(null, res);
            }
            this.tooManyRequestsResponse(res);
        });
    }
    broadcastBatchEventsRateLimitingMiddleware(res, next) {
        let rateLimiterPoints = res.body.batch.reduce((rateLimiterPoints, event) => {
            let channels = event.channels || [event.channel];
            return rateLimiterPoints += channels.length;
        }, 0);
        this.server.rateLimiter.consumeBackendEventPoints(rateLimiterPoints, res.app).then(response => {
            if (response.canContinue) {
                for (let header in response.headers) {
                    res.writeHeader(header, '' + response.headers[header]);
                }
                return next(null, res);
            }
            this.tooManyRequestsResponse(res);
        });
    }
    attachMiddleware(res, functions) {
        return new Promise((resolve, reject) => {
            let waterfallInit = callback => callback(null, res);
            let abortHandlerMiddleware = (res, callback) => {
                res.onAborted(() => {
                    log_1.Log.warning({ message: 'Aborted request.', res });
                });
                callback(null, res);
            };
            async_1.default.waterfall([
                waterfallInit.bind(this),
                abortHandlerMiddleware.bind(this),
                ...functions.map(fn => fn.bind(this)),
            ], (err, res) => {
                if (err) {
                    this.serverErrorResponse(res, 'A server error has occurred.');
                    log_1.Log.error(err);
                    return reject({ res, err });
                }
                resolve(res);
            });
        });
    }
    readJson(res, cb, err) {
        let buffer;
        let loggingAction = (payload) => {
            if (this.server.options.debug) {
                log_1.Log.httpTitle('⚡ HTTP Payload received');
                log_1.Log.http(payload);
            }
        };
        res.onData((ab, isLast) => {
            let chunk = Buffer.from(ab);
            if (isLast) {
                let json = {};
                let raw = '{}';
                if (buffer) {
                    try {
                        json = JSON.parse(Buffer.concat([buffer, chunk]));
                    }
                    catch (e) {
                    }
                    try {
                        raw = Buffer.concat([buffer, chunk]).toString();
                    }
                    catch (e) {
                    }
                    cb(json, raw);
                    loggingAction(json);
                }
                else {
                    try {
                        json = JSON.parse(chunk);
                        raw = chunk.toString();
                    }
                    catch (e) {
                    }
                    cb(json, raw);
                    loggingAction(json);
                }
            }
            else {
                if (buffer) {
                    buffer = Buffer.concat([buffer, chunk]);
                }
                else {
                    buffer = Buffer.concat([chunk]);
                }
            }
        });
        res.onAborted(err);
    }
    signatureIsValid(res) {
        return this.getSignedToken(res).then(token => {
            return token === res.query.auth_signature;
        });
    }
    sendJson(res, data, status = '200 OK') {
        try {
            return res.writeStatus(status)
                .writeHeader('Content-Type', 'application/json')
                .end(JSON.stringify(data), true);
        }
        catch (e) {
            log_1.Log.warningTitle('Response could not be sent');
            log_1.Log.warning(e);
        }
    }
    send(res, data, status = '200 OK') {
        try {
            return res.writeStatus(status).end(data, true);
        }
        catch (e) {
            log_1.Log.warningTitle('Response could not be sent');
            log_1.Log.warning(e);
        }
    }
    getSignedToken(res) {
        return Promise.resolve(res.app.signingTokenFromRequest(res));
    }
}
exports.HttpHandler = HttpHandler;
