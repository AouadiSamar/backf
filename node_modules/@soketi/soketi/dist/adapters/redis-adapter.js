"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisAdapter = void 0;
const horizontal_adapter_1 = require("./horizontal-adapter");
const log_1 = require("../log");
const ioredis_1 = require("ioredis");
class RedisAdapter extends horizontal_adapter_1.HorizontalAdapter {
    constructor(server) {
        super(server);
        this.channel = 'redis-adapter';
        if (server.options.adapter.redis.prefix) {
            this.channel = server.options.adapter.redis.prefix + '#' + this.channel;
        }
        this.requestChannel = `${this.channel}#comms#req`;
        this.responseChannel = `${this.channel}#comms#res`;
        this.requestsTimeout = server.options.adapter.redis.requestsTimeout;
    }
    async init() {
        let redisOptions = {
            maxRetriesPerRequest: 2,
            retryStrategy: times => times * 2,
            ...this.server.options.database.redis,
        };
        this.subClient = this.server.options.adapter.redis.clusterMode
            ? new ioredis_1.Cluster(this.server.options.database.redis.clusterNodes, { ...redisOptions, ...this.server.options.adapter.redis.redisSubOptions })
            : new ioredis_1.default({ ...redisOptions, ...this.server.options.adapter.redis.redisSubOptions });
        this.pubClient = this.server.options.adapter.redis.clusterMode
            ? new ioredis_1.Cluster(this.server.options.database.redis.clusterNodes, { ...redisOptions, ...this.server.options.adapter.redis.redisPubOptions })
            : new ioredis_1.default({ ...redisOptions, ...this.server.options.adapter.redis.redisPubOptions });
        const onError = err => {
            if (err) {
                log_1.Log.warning(err);
            }
        };
        this.subClient.psubscribe(`${this.channel}*`, onError);
        this.subClient.on('pmessageBuffer', this.onMessage.bind(this));
        this.subClient.on('messageBuffer', this.processMessage.bind(this));
        this.subClient.subscribe(this.requestChannel, this.responseChannel, onError);
        this.pubClient.on('error', onError);
        this.subClient.on('error', onError);
        return this;
    }
    broadcastToChannel(channel, data) {
        this.pubClient.publish(channel, data);
    }
    processMessage(redisChannel, msg) {
        redisChannel = redisChannel.toString();
        msg = msg.toString();
        if (redisChannel.startsWith(this.responseChannel)) {
            this.onResponse(redisChannel, msg);
        }
        else if (redisChannel.startsWith(this.requestChannel)) {
            this.onRequest(redisChannel, msg);
        }
    }
    onMessage(pattern, redisChannel, msg) {
        redisChannel = redisChannel.toString();
        msg = msg.toString();
        if (!redisChannel.startsWith(this.channel)) {
            return;
        }
        let decodedMessage = JSON.parse(msg);
        if (typeof decodedMessage !== 'object') {
            return;
        }
        const { uuid, appId, channel, data, exceptingId } = decodedMessage;
        if (uuid === this.uuid || !appId || !channel || !data) {
            return;
        }
        super.sendLocally(appId, channel, data, exceptingId);
    }
    getNumSub() {
        if (this.server.options.adapter.redis.clusterMode) {
            const nodes = this.pubClient.nodes();
            return Promise.all(nodes.map((node) => node.pubsub('NUMSUB', this.requestChannel))).then((values) => {
                let number = values.reduce((numSub, value) => {
                    return numSub += parseInt(value[1], 10);
                }, 0);
                if (this.server.options.debug) {
                    log_1.Log.info(`Found ${number} subscribers in the Redis cluster.`);
                }
                return number;
            });
        }
        else {
            return new Promise((resolve, reject) => {
                this.pubClient.pubsub('NUMSUB', this.requestChannel, (err, numSub) => {
                    if (err) {
                        return reject(err);
                    }
                    let number = parseInt(numSub[1], 10);
                    if (this.server.options.debug) {
                        log_1.Log.info(`Found ${number} subscribers in the Redis cluster.`);
                    }
                    resolve(number);
                });
            });
        }
    }
    disconnect() {
        return Promise.all([
            this.subClient.quit(),
            this.pubClient.quit(),
        ]).then(() => {
        });
    }
}
exports.RedisAdapter = RedisAdapter;
