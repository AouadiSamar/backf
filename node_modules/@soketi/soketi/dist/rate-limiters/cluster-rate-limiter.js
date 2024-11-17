"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClusterRateLimiter = void 0;
const local_rate_limiter_1 = require("./local-rate-limiter");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const cluster = require('cluster');
const pm2 = require('pm2');
class ClusterRateLimiter extends local_rate_limiter_1.LocalRateLimiter {
    constructor(server) {
        super(server);
        this.server = server;
        if (cluster.isPrimary || typeof cluster.isPrimary === 'undefined') {
            if (server.pm2) {
                new rate_limiter_flexible_1.RateLimiterClusterMasterPM2(pm2);
            }
            else {
                server.discover.join('rate_limiter:limiters', (rateLimiters) => {
                    this.rateLimiters = Object.fromEntries(Object.entries(rateLimiters).map(([key, rateLimiterObject]) => {
                        return [
                            key,
                            this.createNewRateLimiter(key.split(':')[0], rateLimiterObject._points),
                        ];
                    }));
                });
                server.discover.join('rate_limiter:consume', ({ app, eventKey, points, maxPoints }) => {
                    super.consume(app, eventKey, points, maxPoints);
                });
                server.discover.on('added', () => {
                    if (server.nodes.get('self').isMaster) {
                        this.sendRateLimiters();
                    }
                });
            }
        }
    }
    consume(app, eventKey, points, maxPoints) {
        return super.consume(app, eventKey, points, maxPoints).then((response) => {
            if (response.canContinue) {
                this.server.discover.send('rate_limiter:consume', {
                    app, eventKey, points, maxPoints,
                });
            }
            return response;
        });
    }
    disconnect() {
        return super.disconnect().then(() => {
            if (this.server.nodes.get('self').isMaster) {
                this.server.discover.demote();
                this.server.discover.send('rate_limiter:limiters', this.rateLimiters);
            }
        });
    }
    sendRateLimiters() {
        this.server.discover.send('rate_limiter:limiters', this.rateLimiters);
    }
}
exports.ClusterRateLimiter = ClusterRateLimiter;
