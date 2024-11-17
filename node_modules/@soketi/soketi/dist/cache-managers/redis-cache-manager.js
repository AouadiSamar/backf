"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheManager = void 0;
const ioredis_1 = require("ioredis");
class RedisCacheManager {
    constructor(server) {
        this.server = server;
        let redisOptions = {
            ...server.options.database.redis,
            ...server.options.cache.redis.redisOptions,
        };
        this.redisConnection = server.options.cache.redis.clusterMode
            ? new ioredis_1.Cluster(server.options.database.redis.clusterNodes, {
                scaleReads: 'slave',
                ...redisOptions,
            })
            : new ioredis_1.default(redisOptions);
    }
    has(key) {
        return this.get(key).then(result => {
            return result ? true : false;
        });
    }
    get(key) {
        return this.redisConnection.get(key);
    }
    set(key, value, ttlSeconds = -1) {
        return ttlSeconds > 0
            ? this.redisConnection.set(key, value, 'EX', ttlSeconds)
            : this.redisConnection.set(key, value);
    }
    disconnect() {
        return this.redisConnection.quit().then(() => {
        });
    }
}
exports.RedisCacheManager = RedisCacheManager;
