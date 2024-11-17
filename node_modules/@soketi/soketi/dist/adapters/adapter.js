"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Adapter = void 0;
const cluster_adapter_1 = require("./cluster-adapter");
const local_adapter_1 = require("./local-adapter");
const log_1 = require("../log");
const nats_adapter_1 = require("./nats-adapter");
const redis_adapter_1 = require("./redis-adapter");
class Adapter {
    constructor(server) {
        if (server.options.adapter.driver === 'local') {
            this.driver = new local_adapter_1.LocalAdapter(server);
        }
        else if (server.options.adapter.driver === 'redis') {
            this.driver = new redis_adapter_1.RedisAdapter(server);
        }
        else if (server.options.adapter.driver === 'nats') {
            this.driver = new nats_adapter_1.NatsAdapter(server);
        }
        else if (server.options.adapter.driver === 'cluster') {
            this.driver = new cluster_adapter_1.ClusterAdapter(server);
        }
        else {
            log_1.Log.error('Adapter driver not set.');
        }
    }
    async init() {
        return await this.driver.init();
    }
    getNamespace(appId) {
        return this.driver.getNamespace(appId);
    }
    getNamespaces() {
        return this.driver.getNamespaces();
    }
    async addSocket(appId, ws) {
        return this.driver.addSocket(appId, ws);
    }
    async removeSocket(appId, wsId) {
        return this.driver.removeSocket(appId, wsId);
    }
    async addToChannel(appId, channel, ws) {
        return this.driver.addToChannel(appId, channel, ws);
    }
    async removeFromChannel(appId, channel, wsId) {
        return this.driver.removeFromChannel(appId, channel, wsId);
    }
    async getSockets(appId, onlyLocal = false) {
        return this.driver.getSockets(appId, onlyLocal);
    }
    async getSocketsCount(appId, onlyLocal) {
        return this.driver.getSocketsCount(appId, onlyLocal);
    }
    async getChannels(appId, onlyLocal = false) {
        return this.driver.getChannels(appId, onlyLocal);
    }
    async getChannelsWithSocketsCount(appId, onlyLocal = false) {
        return this.driver.getChannelsWithSocketsCount(appId, onlyLocal);
    }
    async getChannelSockets(appId, channel, onlyLocal = false) {
        return this.driver.getChannelSockets(appId, channel, onlyLocal);
    }
    async getChannelSocketsCount(appId, channel, onlyLocal) {
        return this.driver.getChannelSocketsCount(appId, channel, onlyLocal);
    }
    async getChannelMembers(appId, channel, onlyLocal = false) {
        return this.driver.getChannelMembers(appId, channel, onlyLocal);
    }
    async getChannelMembersCount(appId, channel, onlyLocal) {
        return this.driver.getChannelMembersCount(appId, channel, onlyLocal);
    }
    async isInChannel(appId, channel, wsId, onlyLocal) {
        return this.driver.isInChannel(appId, channel, wsId, onlyLocal);
    }
    send(appId, channel, data, exceptingId = null) {
        return this.driver.send(appId, channel, data, exceptingId);
    }
    terminateUserConnections(appId, userId) {
        return this.driver.terminateUserConnections(appId, userId);
    }
    addUser(ws) {
        return this.driver.addUser(ws);
    }
    removeUser(ws) {
        return this.driver.removeUser(ws);
    }
    getUserSockets(appId, userId) {
        return this.driver.getUserSockets(appId, userId);
    }
    clearNamespace(namespaceId) {
        return this.driver.clearNamespace(namespaceId);
    }
    clearNamespaces() {
        return this.driver.clearNamespaces();
    }
    disconnect() {
        return this.driver.disconnect();
    }
}
exports.Adapter = Adapter;
