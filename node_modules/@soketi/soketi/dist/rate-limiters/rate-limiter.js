"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const cluster_rate_limiter_1 = require("./cluster-rate-limiter");
const local_rate_limiter_1 = require("./local-rate-limiter");
const log_1 = require("./../log");
const redis_rate_limiter_1 = require("./redis-rate-limiter");
class RateLimiter {
    constructor(server) {
        if (server.options.rateLimiter.driver === 'local') {
            this.driver = new local_rate_limiter_1.LocalRateLimiter(server);
        }
        else if (server.options.rateLimiter.driver === 'redis') {
            this.driver = new redis_rate_limiter_1.RedisRateLimiter(server);
        }
        else if (server.options.rateLimiter.driver === 'cluster') {
            this.driver = new cluster_rate_limiter_1.ClusterRateLimiter(server);
        }
        else {
            log_1.Log.error('No stats driver specified.');
        }
    }
    consumeBackendEventPoints(points, app, ws) {
        return this.driver.consumeBackendEventPoints(points, app, ws);
    }
    consumeFrontendEventPoints(points, app, ws) {
        return this.driver.consumeFrontendEventPoints(points, app, ws);
    }
    consumeReadRequestsPoints(points, app, ws) {
        return this.driver.consumeReadRequestsPoints(points, app, ws);
    }
    createNewRateLimiter(appId, maxPoints) {
        return this.driver.createNewRateLimiter(appId, maxPoints);
    }
    disconnect() {
        return this.driver.disconnect();
    }
}
exports.RateLimiter = RateLimiter;
