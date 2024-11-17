"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Namespace = void 0;
class Namespace {
    constructor(appId) {
        this.appId = appId;
        this.channels = new Map();
        this.sockets = new Map();
        this.users = new Map();
    }
    getSockets() {
        return Promise.resolve(this.sockets);
    }
    addSocket(ws) {
        return new Promise(resolve => {
            this.sockets.set(ws.id, ws);
            resolve(true);
        });
    }
    async removeSocket(wsId) {
        this.removeFromChannel(wsId, [...this.channels.keys()]);
        return this.sockets.delete(wsId);
    }
    addToChannel(ws, channel) {
        return new Promise(resolve => {
            if (!this.channels.has(channel)) {
                this.channels.set(channel, new Set);
            }
            this.channels.get(channel).add(ws.id);
            resolve(this.channels.get(channel).size);
        });
    }
    async removeFromChannel(wsId, channel) {
        let remove = (channel) => {
            if (this.channels.has(channel)) {
                this.channels.get(channel).delete(wsId);
                if (this.channels.get(channel).size === 0) {
                    this.channels.delete(channel);
                }
            }
        };
        return new Promise(resolve => {
            if (Array.isArray(channel)) {
                channel.forEach(ch => remove(ch));
                return resolve();
            }
            remove(channel);
            resolve(this.channels.has(channel) ? this.channels.get(channel).size : 0);
        });
    }
    isInChannel(wsId, channel) {
        return new Promise(resolve => {
            if (!this.channels.has(channel)) {
                return resolve(false);
            }
            resolve(this.channels.get(channel).has(wsId));
        });
    }
    getChannels() {
        return Promise.resolve(this.channels);
    }
    getChannelsWithSocketsCount() {
        return this.getChannels().then((channels) => {
            let list = new Map();
            for (let [channel, connections] of [...channels]) {
                list.set(channel, connections.size);
            }
            return list;
        });
    }
    getChannelSockets(channel) {
        return new Promise(resolve => {
            if (!this.channels.has(channel)) {
                return resolve(new Map());
            }
            let wsIds = this.channels.get(channel);
            resolve(Array.from(wsIds).reduce((sockets, wsId) => {
                if (!this.sockets.has(wsId)) {
                    return sockets;
                }
                return sockets.set(wsId, this.sockets.get(wsId));
            }, new Map()));
        });
    }
    getChannelMembers(channel) {
        return this.getChannelSockets(channel).then(sockets => {
            return Array.from(sockets).reduce((members, [wsId, ws]) => {
                let member = ws.presence ? ws.presence.get(channel) : null;
                if (member) {
                    members.set(member.user_id, member.user_info);
                }
                return members;
            }, new Map());
        });
    }
    terminateUserConnections(userId) {
        this.getSockets().then(sockets => {
            [...sockets].forEach(([wsId, ws]) => {
                if (ws.user && ws.user.id == userId) {
                    ws.sendJson({
                        event: 'pusher:error',
                        data: {
                            code: 4009,
                            message: 'You got disconnected by the app.',
                        },
                    });
                    try {
                        ws.end(4009);
                    }
                    catch (e) {
                    }
                }
            });
        });
    }
    addUser(ws) {
        if (!ws.user) {
            return Promise.resolve();
        }
        if (!this.users.has(ws.user.id)) {
            this.users.set(ws.user.id, new Set());
        }
        if (!this.users.get(ws.user.id).has(ws.id)) {
            this.users.get(ws.user.id).add(ws.id);
        }
        return Promise.resolve();
    }
    removeUser(ws) {
        if (!ws.user) {
            return Promise.resolve();
        }
        if (this.users.has(ws.user.id)) {
            this.users.get(ws.user.id).delete(ws.id);
        }
        if (this.users.get(ws.user.id) && this.users.get(ws.user.id).size === 0) {
            this.users.delete(ws.user.id);
        }
        return Promise.resolve();
    }
    getUserSockets(userId) {
        let wsIds = this.users.get(userId);
        if (!wsIds || wsIds.size === 0) {
            return Promise.resolve(new Set());
        }
        return Promise.resolve([...wsIds].reduce((sockets, wsId) => {
            sockets.add(this.sockets.get(wsId));
            return sockets;
        }, new Set()));
    }
}
exports.Namespace = Namespace;
