"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalRateLimiter = void 0;
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
class LocalRateLimiter {
    constructor(server) {
        this.server = server;
        this.rateLimiters = {};
    }
    consumeBackendEventPoints(points, app, ws) {
        return this.consume(app, `${app.id}:backend:events`, points, app.maxBackendEventsPerSecond);
    }
    consumeFrontendEventPoints(points, app, ws) {
        return this.consume(app, `${app.id}:frontend:events:${ws.id}`, points, app.maxClientEventsPerSecond);
    }
    consumeReadRequestsPoints(points, app, ws) {
        return this.consume(app, `${app.id}:backend:request_read`, points, app.maxReadRequestsPerSecond);
    }
    createNewRateLimiter(appId, maxPoints) {
        return new rate_limiter_flexible_1.RateLimiterMemory({
            points: maxPoints,
            duration: 1,
            keyPrefix: `app:${appId}`,
        });
    }
    disconnect() {
        return Promise.resolve();
    }
    initializeRateLimiter(appId, eventKey, maxPoints) {
        if (this.rateLimiters[`${appId}:${eventKey}`]) {
            return new Promise(resolve => {
                this.rateLimiters[`${appId}:${eventKey}`].points = maxPoints;
                resolve(this.rateLimiters[`${appId}:${eventKey}`]);
            });
        }
        this.rateLimiters[`${appId}:${eventKey}`] = this.createNewRateLimiter(appId, maxPoints);
        return Promise.resolve(this.rateLimiters[`${appId}:${eventKey}`]);
    }
    consume(app, eventKey, points, maxPoints) {
        if (maxPoints < 0) {
            return Promise.resolve({
                canContinue: true,
                rateLimiterRes: null,
                headers: {},
            });
        }
        let calculateHeaders = (rateLimiterRes) => ({
            'Retry-After': rateLimiterRes.msBeforeNext / 1000,
            'X-RateLimit-Limit': maxPoints,
            'X-RateLimit-Remaining': rateLimiterRes.remainingPoints,
        });
        return this.initializeRateLimiter(app.id, eventKey, maxPoints).then(rateLimiter => {
            return rateLimiter.consume(eventKey, points).then((rateLimiterRes) => {
                return {
                    canContinue: true,
                    rateLimiterRes,
                    headers: calculateHeaders(rateLimiterRes),
                };
            }).catch((rateLimiterRes) => {
                return {
                    canContinue: false,
                    rateLimiterRes,
                    headers: calculateHeaders(rateLimiterRes),
                };
            });
        });
    }
}
exports.LocalRateLimiter = LocalRateLimiter;
