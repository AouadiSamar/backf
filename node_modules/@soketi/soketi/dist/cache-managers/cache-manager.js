"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
const log_1 = require("../log");
const memory_cache_manager_1 = require("./memory-cache-manager");
const redis_cache_manager_1 = require("./redis-cache-manager");
class CacheManager {
    constructor(server) {
        this.server = server;
        if (server.options.cache.driver === 'memory') {
            this.driver = new memory_cache_manager_1.MemoryCacheManager(server);
        }
        else if (server.options.cache.driver === 'redis') {
            this.driver = new redis_cache_manager_1.RedisCacheManager(server);
        }
        else {
            log_1.Log.error('Cache driver not set.');
        }
    }
    has(key) {
        return this.driver.has(key);
    }
    get(key) {
        return this.driver.get(key);
    }
    set(key, value, ttlSeconds) {
        return this.driver.set(key, value, ttlSeconds);
    }
    disconnect() {
        return this.driver.disconnect();
    }
}
exports.CacheManager = CacheManager;
