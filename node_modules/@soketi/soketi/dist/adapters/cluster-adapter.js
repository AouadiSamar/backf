"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterAdapter = void 0;
const horizontal_adapter_1 = require("./horizontal-adapter");
class ClusterAdapter extends horizontal_adapter_1.HorizontalAdapter {
    constructor(server) {
        super(server);
        this.channel = 'cluster-adapter';
        this.channel = server.clusterPrefix(this.channel);
        this.requestChannel = `${this.channel}#comms#req`;
        this.responseChannel = `${this.channel}#comms#res`;
        this.requestsTimeout = server.options.adapter.cluster.requestsTimeout;
    }
    async init() {
        this.server.discover.join(this.requestChannel, this.onRequest.bind(this));
        this.server.discover.join(this.responseChannel, this.onResponse.bind(this));
        this.server.discover.join(this.channel, this.onMessage.bind(this));
        return this;
    }
    onRequest(msg) {
        if (typeof msg === 'object') {
            msg = JSON.stringify(msg);
        }
        super.onRequest(this.requestChannel, msg);
    }
    onResponse(msg) {
        if (typeof msg === 'object') {
            msg = JSON.stringify(msg);
        }
        super.onResponse(this.responseChannel, msg);
    }
    onMessage(msg) {
        if (typeof msg === 'string') {
            msg = JSON.parse(msg);
        }
        let message = msg;
        const { uuid, appId, channel, data, exceptingId } = message;
        if (uuid === this.uuid || !appId || !channel || !data) {
            return;
        }
        super.sendLocally(appId, channel, data, exceptingId);
    }
    broadcastToChannel(channel, data) {
        this.server.discover.send(channel, data);
    }
    getNumSub() {
        return Promise.resolve(this.server.nodes.size);
    }
}
exports.ClusterAdapter = ClusterAdapter;
