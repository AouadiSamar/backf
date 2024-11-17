"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryCacheManager = void 0;
class MemoryCacheManager {
    constructor(server) {
        this.server = server;
        this.memory = {};
        setInterval(() => {
            for (let [key, { ttlSeconds, setTime }] of Object.entries(this.memory)) {
                let currentTime = parseInt((new Date().getTime() / 1000));
                if (ttlSeconds > 0 && (setTime + ttlSeconds) <= currentTime) {
                    delete this.memory[key];
                }
            }
        }, 1000);
    }
    has(key) {
        return Promise.resolve(typeof this.memory[key] !== 'undefined' ? Boolean(this.memory[key]) : false);
    }
    get(key) {
        return Promise.resolve(typeof this.memory[key] !== 'undefined' ? this.memory[key].value : null);
    }
    set(key, value, ttlSeconds = -1) {
        this.memory[key] = {
            value,
            ttlSeconds,
            setTime: parseInt((new Date().getTime() / 1000)),
        };
        return Promise.resolve(true);
    }
    disconnect() {
        this.memory = {};
        return Promise.resolve();
    }
}
exports.MemoryCacheManager = MemoryCacheManager;
