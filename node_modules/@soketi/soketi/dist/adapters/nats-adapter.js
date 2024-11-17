"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatsAdapter = void 0;
const nats_1 = require("nats");
const horizontal_adapter_1 = require("./horizontal-adapter");
const util_1 = require("nats/lib/nats-base-client/util");
class NatsAdapter extends horizontal_adapter_1.HorizontalAdapter {
    constructor(server) {
        super(server);
        this.channel = 'nats-adapter';
        if (server.options.adapter.nats.prefix) {
            this.channel = server.options.adapter.nats.prefix + '#' + this.channel;
        }
        this.requestChannel = `${this.channel}#comms#req`;
        this.responseChannel = `${this.channel}#comms#res`;
        this.jc = (0, nats_1.JSONCodec)();
        this.sc = (0, nats_1.StringCodec)();
        this.requestsTimeout = server.options.adapter.nats.requestsTimeout;
    }
    async init() {
        return new Promise(resolve => {
            (0, nats_1.connect)({
                servers: this.server.options.adapter.nats.servers,
                user: this.server.options.adapter.nats.user,
                pass: this.server.options.adapter.nats.pass,
                token: this.server.options.adapter.nats.token,
                pingInterval: 30000,
                timeout: this.server.options.adapter.nats.timeout,
                reconnect: false,
            }).then((connection) => {
                this.connection = connection;
                this.connection.subscribe(this.requestChannel, { callback: (_err, msg) => this.onRequest(msg) });
                this.connection.subscribe(this.responseChannel, { callback: (_err, msg) => this.onResponse(msg) });
                this.connection.subscribe(this.channel, { callback: (_err, msg) => this.onMessage(msg) });
                resolve(this);
            });
        });
    }
    onRequest(msg) {
        super.onRequest(this.requestChannel, JSON.stringify(this.jc.decode(msg.data)));
    }
    onResponse(msg) {
        super.onResponse(this.responseChannel, JSON.stringify(this.jc.decode(msg.data)));
    }
    onMessage(msg) {
        let message = this.jc.decode(msg.data);
        const { uuid, appId, channel, data, exceptingId } = message;
        if (uuid === this.uuid || !appId || !channel || !data) {
            return;
        }
        super.sendLocally(appId, channel, data, exceptingId);
    }
    broadcastToChannel(channel, data) {
        this.connection.publish(channel, this.jc.encode(JSON.parse(data)));
    }
    async getNumSub() {
        let nodesNumber = this.server.options.adapter.nats.nodesNumber;
        if (nodesNumber && nodesNumber > 0) {
            return Promise.resolve(nodesNumber);
        }
        return new Promise(resolve => {
            let responses = [];
            let calculateResponses = () => responses.reduce((total, response) => {
                let { data } = JSON.parse(this.sc.decode(response.data));
                return total += data.total;
            }, 0);
            let waiter = (0, util_1.timeout)(1000);
            waiter.finally(() => resolve(calculateResponses()));
            this.connection.request('$SYS.REQ.SERVER.PING.CONNZ').then(response => {
                responses.push(response);
                waiter.cancel();
                waiter = (0, util_1.timeout)(200);
                waiter.catch(() => resolve(calculateResponses()));
            });
        });
    }
    disconnect() {
        return this.connection.close();
    }
}
exports.NatsAdapter = NatsAdapter;
