"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HorizontalAdapter = exports.RequestType = void 0;
const local_adapter_1 = require("./local-adapter");
const log_1 = require("../log");
const uuid_1 = require("uuid");
var RequestType;
(function (RequestType) {
    RequestType[RequestType["SOCKETS"] = 0] = "SOCKETS";
    RequestType[RequestType["CHANNELS"] = 1] = "CHANNELS";
    RequestType[RequestType["CHANNEL_SOCKETS"] = 2] = "CHANNEL_SOCKETS";
    RequestType[RequestType["CHANNEL_MEMBERS"] = 3] = "CHANNEL_MEMBERS";
    RequestType[RequestType["SOCKETS_COUNT"] = 4] = "SOCKETS_COUNT";
    RequestType[RequestType["CHANNEL_MEMBERS_COUNT"] = 5] = "CHANNEL_MEMBERS_COUNT";
    RequestType[RequestType["CHANNEL_SOCKETS_COUNT"] = 6] = "CHANNEL_SOCKETS_COUNT";
    RequestType[RequestType["SOCKET_EXISTS_IN_CHANNEL"] = 7] = "SOCKET_EXISTS_IN_CHANNEL";
    RequestType[RequestType["CHANNELS_WITH_SOCKETS_COUNT"] = 8] = "CHANNELS_WITH_SOCKETS_COUNT";
    RequestType[RequestType["TERMINATE_USER_CONNECTIONS"] = 9] = "TERMINATE_USER_CONNECTIONS";
})(RequestType = exports.RequestType || (exports.RequestType = {}));
class HorizontalAdapter extends local_adapter_1.LocalAdapter {
    constructor() {
        super(...arguments);
        this.requestsTimeout = 5000;
        this.requests = new Map();
        this.channel = 'horizontal-adapter';
        this.uuid = (0, uuid_1.v4)();
        this.resolvers = {
            [RequestType.SOCKETS]: {
                computeResponse: (request, response) => {
                    if (response.sockets) {
                        response.sockets.forEach(ws => request.sockets.set(ws.id, ws));
                    }
                },
                resolveValue: (request, response) => {
                    return request.sockets;
                },
            },
            [RequestType.CHANNEL_SOCKETS]: {
                computeResponse: (request, response) => {
                    if (response.sockets) {
                        response.sockets.forEach(ws => request.sockets.set(ws.id, ws));
                    }
                },
                resolveValue: (request, response) => {
                    return request.sockets;
                },
            },
            [RequestType.CHANNELS]: {
                computeResponse: (request, response) => {
                    if (response.channels) {
                        response.channels.forEach(([channel, connections]) => {
                            if (request.channels.has(channel)) {
                                connections.forEach(connection => {
                                    request.channels.set(channel, request.channels.get(channel).add(connection));
                                });
                            }
                            else {
                                request.channels.set(channel, new Set(connections));
                            }
                        });
                    }
                },
                resolveValue: (request, response) => {
                    return request.channels;
                },
            },
            [RequestType.CHANNELS_WITH_SOCKETS_COUNT]: {
                computeResponse: (request, response) => {
                    if (response.channelsWithSocketsCount) {
                        response.channelsWithSocketsCount.forEach(([channel, connectionsCount]) => {
                            if (request.channelsWithSocketsCount.has(channel)) {
                                request.channelsWithSocketsCount.set(channel, request.channelsWithSocketsCount.get(channel) + connectionsCount);
                            }
                            else {
                                request.channelsWithSocketsCount.set(channel, connectionsCount);
                            }
                        });
                    }
                },
                resolveValue: (request, response) => {
                    return request.channelsWithSocketsCount;
                },
            },
            [RequestType.CHANNEL_MEMBERS]: {
                computeResponse: (request, response) => {
                    if (response.members) {
                        response.members.forEach(([id, member]) => request.members.set(id, member));
                    }
                },
                resolveValue: (request, response) => {
                    return request.members;
                },
            },
            [RequestType.SOCKETS_COUNT]: {
                computeResponse: (request, response) => {
                    if (typeof response.totalCount !== 'undefined') {
                        request.totalCount += response.totalCount;
                    }
                },
                resolveValue: (request, response) => {
                    return request.totalCount;
                },
            },
            [RequestType.CHANNEL_MEMBERS_COUNT]: {
                computeResponse: (request, response) => {
                    if (typeof response.totalCount !== 'undefined') {
                        request.totalCount += response.totalCount;
                    }
                },
                resolveValue: (request, response) => {
                    return request.totalCount;
                },
            },
            [RequestType.CHANNEL_SOCKETS_COUNT]: {
                computeResponse: (request, response) => {
                    if (typeof response.totalCount !== 'undefined') {
                        request.totalCount += response.totalCount;
                    }
                },
                resolveValue: (request, response) => {
                    return request.totalCount;
                },
            },
            [RequestType.SOCKET_EXISTS_IN_CHANNEL]: {
                computeResponse: (request, response) => {
                    if (typeof response.exists !== 'undefined' && response.exists === true) {
                        request.exists = true;
                    }
                },
                resolveValue: (request, response) => {
                    return request.exists || false;
                },
            },
            [RequestType.TERMINATE_USER_CONNECTIONS]: {
                computeResponse: (request, response) => {
                },
                resolveValue: (request, response) => {
                    return true;
                },
            },
        };
    }
    sendToResponseChannel(data) {
        this.broadcastToChannel(this.responseChannel, data);
    }
    sendToRequestChannel(data) {
        this.broadcastToChannel(this.requestChannel, data);
    }
    send(appId, channel, data, exceptingId = null) {
        this.broadcastToChannel(this.channel, JSON.stringify({
            uuid: this.uuid,
            appId,
            channel,
            data,
            exceptingId,
        }));
        this.sendLocally(appId, channel, data, exceptingId);
    }
    sendLocally(appId, channel, data, exceptingId = null) {
        super.send(appId, channel, data, exceptingId);
    }
    terminateUserConnections(appId, userId) {
        new Promise((resolve, reject) => {
            this.getNumSub().then(numSub => {
                if (numSub <= 1) {
                    this.terminateLocalUserConnections(appId, userId);
                    return;
                }
                this.sendRequest(appId, RequestType.TERMINATE_USER_CONNECTIONS, resolve, reject, { numSub }, { opts: { userId } });
            });
        });
        this.terminateLocalUserConnections(appId, userId);
    }
    terminateLocalUserConnections(appId, userId) {
        super.terminateUserConnections(appId, userId);
    }
    async getSockets(appId, onlyLocal = false) {
        return new Promise((resolve, reject) => {
            super.getSockets(appId, true).then(localSockets => {
                if (onlyLocal) {
                    return resolve(localSockets);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(localSockets);
                    }
                    this.sendRequest(appId, RequestType.SOCKETS, resolve, reject, { numSub, sockets: localSockets });
                });
            });
        });
    }
    async getSocketsCount(appId, onlyLocal) {
        return new Promise((resolve, reject) => {
            super.getSocketsCount(appId).then(wsCount => {
                if (onlyLocal) {
                    return resolve(wsCount);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(wsCount);
                    }
                    this.sendRequest(appId, RequestType.SOCKETS_COUNT, resolve, reject, { numSub, totalCount: wsCount });
                });
            });
        });
    }
    async getChannels(appId, onlyLocal = false) {
        return new Promise((resolve, reject) => {
            super.getChannels(appId).then(localChannels => {
                if (onlyLocal) {
                    resolve(localChannels);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(localChannels);
                    }
                    this.sendRequest(appId, RequestType.CHANNELS, resolve, reject, { numSub, channels: localChannels });
                });
            });
        });
    }
    async getChannelsWithSocketsCount(appId, onlyLocal) {
        return new Promise((resolve, reject) => {
            super.getChannelsWithSocketsCount(appId).then(list => {
                if (onlyLocal) {
                    return resolve(list);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(list);
                    }
                    this.sendRequest(appId, RequestType.CHANNELS_WITH_SOCKETS_COUNT, resolve, reject, { numSub, channelsWithSocketsCount: list });
                });
            });
        });
    }
    async getChannelSockets(appId, channel, onlyLocal = false) {
        return new Promise((resolve, reject) => {
            super.getChannelSockets(appId, channel).then(localSockets => {
                if (onlyLocal) {
                    return resolve(localSockets);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(localSockets);
                    }
                    this.sendRequest(appId, RequestType.CHANNEL_SOCKETS, resolve, reject, { numSub, sockets: localSockets }, { opts: { channel } });
                });
            });
        });
    }
    async getChannelSocketsCount(appId, channel, onlyLocal) {
        return new Promise((resolve, reject) => {
            super.getChannelSocketsCount(appId, channel).then(wsCount => {
                if (onlyLocal) {
                    return resolve(wsCount);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(wsCount);
                    }
                    this.sendRequest(appId, RequestType.CHANNEL_SOCKETS_COUNT, resolve, reject, { numSub, totalCount: wsCount }, { opts: { channel } });
                });
            });
        });
    }
    async getChannelMembers(appId, channel, onlyLocal = false) {
        return new Promise((resolve, reject) => {
            super.getChannelMembers(appId, channel).then(localMembers => {
                if (onlyLocal) {
                    return resolve(localMembers);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(localMembers);
                    }
                    return this.sendRequest(appId, RequestType.CHANNEL_MEMBERS, resolve, reject, { numSub, members: localMembers }, { opts: { channel } });
                });
            });
        });
    }
    async getChannelMembersCount(appId, channel, onlyLocal) {
        return new Promise((resolve, reject) => {
            super.getChannelMembersCount(appId, channel).then(localMembersCount => {
                if (onlyLocal) {
                    return resolve(localMembersCount);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(localMembersCount);
                    }
                    this.sendRequest(appId, RequestType.CHANNEL_MEMBERS_COUNT, resolve, reject, { numSub, totalCount: localMembersCount }, { opts: { channel } });
                });
            });
        });
    }
    async isInChannel(appId, channel, wsId, onlyLocal) {
        return new Promise((resolve, reject) => {
            super.isInChannel(appId, channel, wsId).then(existsLocally => {
                if (onlyLocal || existsLocally) {
                    return resolve(existsLocally);
                }
                this.getNumSub().then(numSub => {
                    if (numSub <= 1) {
                        return resolve(existsLocally);
                    }
                    return this.sendRequest(appId, RequestType.SOCKET_EXISTS_IN_CHANNEL, resolve, reject, { numSub }, { opts: { channel, wsId } });
                });
            });
        });
    }
    onRequest(channel, msg) {
        let request;
        try {
            request = JSON.parse(msg);
        }
        catch (err) {
        }
        let { appId } = request;
        if (this.server.options.debug) {
            log_1.Log.clusterTitle('🧠 Received request from another node');
            log_1.Log.cluster({ request, channel });
        }
        switch (request.type) {
            case RequestType.SOCKETS:
                this.processRequestFromAnotherInstance(request, () => super.getSockets(appId, true).then(sockets => {
                    let localSockets = Array.from(sockets.values());
                    return {
                        sockets: localSockets.map(ws => ({
                            id: ws.id,
                            subscribedChannels: ws.subscribedChannels,
                            presence: ws.presence,
                            ip: ws.ip,
                            ip2: ws.ip2,
                        })),
                    };
                }));
                break;
            case RequestType.CHANNEL_SOCKETS:
                this.processRequestFromAnotherInstance(request, () => super.getChannelSockets(appId, request.opts.channel).then(sockets => {
                    let localSockets = Array.from(sockets.values());
                    return {
                        sockets: localSockets.map(ws => ({
                            id: ws.id,
                            subscribedChannels: ws.subscribedChannels,
                            presence: ws.presence,
                        })),
                    };
                }));
                break;
            case RequestType.CHANNELS:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.getChannels(appId).then(localChannels => {
                        return {
                            channels: [...localChannels].map(([channel, connections]) => [channel, [...connections]]),
                        };
                    });
                });
                break;
            case RequestType.CHANNELS_WITH_SOCKETS_COUNT:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.getChannelsWithSocketsCount(appId).then(channelsWithSocketsCount => {
                        return { channelsWithSocketsCount: [...channelsWithSocketsCount] };
                    });
                });
                break;
            case RequestType.CHANNEL_MEMBERS:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.getChannelMembers(appId, request.opts.channel).then(localMembers => {
                        return { members: [...localMembers] };
                    });
                });
                break;
            case RequestType.SOCKETS_COUNT:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.getSocketsCount(appId).then(localCount => {
                        return { totalCount: localCount };
                    });
                });
                break;
            case RequestType.CHANNEL_MEMBERS_COUNT:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.getChannelMembersCount(appId, request.opts.channel).then(localCount => {
                        return { totalCount: localCount };
                    });
                });
                break;
            case RequestType.CHANNEL_SOCKETS_COUNT:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.getChannelSocketsCount(appId, request.opts.channel).then(localCount => {
                        return { totalCount: localCount };
                    });
                });
                break;
            case RequestType.SOCKET_EXISTS_IN_CHANNEL:
                this.processRequestFromAnotherInstance(request, () => {
                    return super.isInChannel(appId, request.opts.channel, request.opts.wsId).then(existsLocally => {
                        return { exists: existsLocally };
                    });
                });
                break;
            case RequestType.TERMINATE_USER_CONNECTIONS:
                this.processRequestFromAnotherInstance(request, () => {
                    this.terminateLocalUserConnections(appId, request.opts.userId);
                    return Promise.resolve();
                });
                break;
        }
    }
    onResponse(channel, msg) {
        let response;
        try {
            response = JSON.parse(msg);
        }
        catch (err) {
        }
        const requestId = response.requestId;
        if (!requestId || !this.requests.has(requestId)) {
            return;
        }
        const request = this.requests.get(requestId);
        if (this.server.options.debug) {
            log_1.Log.clusterTitle('🧠 Received response from another node to our request');
            log_1.Log.cluster(msg);
        }
        this.processReceivedResponse(response, this.resolvers[request.type].computeResponse.bind(this), this.resolvers[request.type].resolveValue.bind(this));
    }
    sendRequest(appId, type, resolve, reject, requestExtra = {}, requestOptions = {}) {
        const requestId = (0, uuid_1.v4)();
        const timeout = setTimeout(() => {
            if (this.requests.has(requestId)) {
                if (this.server.options.debug) {
                    log_1.Log.error(`Timeout reached while waiting for response in type ${type}. Forcing resolve with the current values.`);
                }
                this.processReceivedResponse({ requestId }, this.resolvers[type].computeResponse.bind(this), this.resolvers[type].resolveValue.bind(this), true);
            }
        }, this.requestsTimeout);
        this.requests.set(requestId, {
            appId,
            type,
            time: Date.now(),
            timeout,
            msgCount: 1,
            resolve,
            reject,
            ...requestExtra,
        });
        const requestToSend = JSON.stringify({
            requestId,
            appId,
            type,
            ...requestOptions,
        });
        this.sendToRequestChannel(requestToSend);
        if (this.server.options.debug) {
            log_1.Log.clusterTitle('✈ Sent message to other instances');
            log_1.Log.cluster({ request: this.requests.get(requestId) });
        }
        this.server.metricsManager.markHorizontalAdapterRequestSent(appId);
    }
    processRequestFromAnotherInstance(request, callbackResolver) {
        let { requestId, appId } = request;
        if (this.requests.has(requestId)) {
            return;
        }
        callbackResolver().then(extra => {
            let response = JSON.stringify({ requestId, ...extra });
            this.sendToResponseChannel(response);
            if (this.server.options.debug) {
                log_1.Log.clusterTitle('✈ Sent response to the instance');
                log_1.Log.cluster({ response });
            }
            this.server.metricsManager.markHorizontalAdapterRequestReceived(appId);
        });
    }
    processReceivedResponse(response, responseComputer, promiseResolver, forceResolve = false) {
        const request = this.requests.get(response.requestId);
        request.msgCount++;
        responseComputer(request, response);
        this.server.metricsManager.markHorizontalAdapterResponseReceived(request.appId);
        if (forceResolve || request.msgCount === request.numSub) {
            clearTimeout(request.timeout);
            if (request.resolve) {
                request.resolve(promiseResolver(request, response));
                this.requests.delete(response.requestId);
                this.server.metricsManager.trackHorizontalAdapterResolvedPromises(request.appId, !forceResolve);
                this.server.metricsManager.trackHorizontalAdapterResolveTime(request.appId, Date.now() - request.time);
            }
        }
    }
}
exports.HorizontalAdapter = HorizontalAdapter;
