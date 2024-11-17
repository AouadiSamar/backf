"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Metrics = void 0;
const log_1 = require("./../log");
const prometheus_metrics_driver_1 = require("./prometheus-metrics-driver");
class Metrics {
    constructor(server) {
        this.server = server;
        if (server.options.metrics.driver === 'prometheus') {
            this.driver = new prometheus_metrics_driver_1.PrometheusMetricsDriver(server);
        }
        else {
            log_1.Log.error('No metrics driver specified.');
        }
    }
    markNewConnection(ws) {
        if (this.server.options.metrics.enabled) {
            this.driver.markNewConnection(ws);
        }
    }
    markDisconnection(ws) {
        if (this.server.options.metrics.enabled) {
            this.driver.markDisconnection(ws);
        }
    }
    markApiMessage(appId, incomingMessage, sentMessage) {
        if (this.server.options.metrics.enabled) {
            this.driver.markApiMessage(appId, incomingMessage, sentMessage);
        }
    }
    markWsMessageSent(appId, sentMessage) {
        if (this.server.options.metrics.enabled) {
            this.driver.markWsMessageSent(appId, sentMessage);
        }
    }
    markWsMessageReceived(appId, message) {
        if (this.server.options.metrics.enabled) {
            this.driver.markWsMessageReceived(appId, message);
        }
    }
    trackHorizontalAdapterResolveTime(appId, time) {
        this.driver.trackHorizontalAdapterResolveTime(appId, time);
    }
    trackHorizontalAdapterResolvedPromises(appId, resolved = true) {
        this.driver.trackHorizontalAdapterResolvedPromises(appId, resolved);
    }
    markHorizontalAdapterRequestSent(appId) {
        this.driver.markHorizontalAdapterRequestSent(appId);
    }
    markHorizontalAdapterRequestReceived(appId) {
        this.driver.markHorizontalAdapterRequestReceived(appId);
    }
    markHorizontalAdapterResponseReceived(appId) {
        this.driver.markHorizontalAdapterResponseReceived(appId);
    }
    getMetricsAsPlaintext() {
        if (!this.server.options.metrics.enabled) {
            return Promise.resolve('');
        }
        return this.driver.getMetricsAsPlaintext();
    }
    getMetricsAsJson() {
        if (!this.server.options.metrics.enabled) {
            return Promise.resolve();
        }
        return this.driver.getMetricsAsJson();
    }
    clear() {
        return this.driver.clear();
    }
}
exports.Metrics = Metrics;
