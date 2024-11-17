"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppManager = void 0;
const app_1 = require("./../app");
const array_app_manager_1 = require("./array-app-manager");
const dynamodb_app_manager_1 = require("./dynamodb-app-manager");
const log_1 = require("../log");
const mysql_app_manager_1 = require("./mysql-app-manager");
const postgres_app_manager_1 = require("./postgres-app-manager");
class AppManager {
    constructor(server) {
        this.server = server;
        if (server.options.appManager.driver === 'array') {
            this.driver = new array_app_manager_1.ArrayAppManager(server);
        }
        else if (server.options.appManager.driver === 'mysql') {
            this.driver = new mysql_app_manager_1.MysqlAppManager(server);
        }
        else if (server.options.appManager.driver === 'postgres') {
            this.driver = new postgres_app_manager_1.PostgresAppManager(server);
        }
        else if (server.options.appManager.driver === 'dynamodb') {
            this.driver = new dynamodb_app_manager_1.DynamoDbAppManager(server);
        }
        else {
            log_1.Log.error('Clients driver not set.');
        }
    }
    findById(id) {
        if (!this.server.options.appManager.cache.enabled) {
            return this.driver.findById(id);
        }
        return this.server.cacheManager.get(`app:${id}`).then(appFromCache => {
            if (appFromCache) {
                return new app_1.App(JSON.parse(appFromCache), this.server);
            }
            return this.driver.findById(id).then(app => {
                this.server.cacheManager.set(`app:${id}`, app ? app.toJson() : app, this.server.options.appManager.cache.ttl);
                return app;
            });
        });
    }
    findByKey(key) {
        if (!this.server.options.appManager.cache.enabled) {
            return this.driver.findByKey(key);
        }
        return this.server.cacheManager.get(`app:${key}`).then(appFromCache => {
            if (appFromCache) {
                return new app_1.App(JSON.parse(appFromCache), this.server);
            }
            return this.driver.findByKey(key).then(app => {
                this.server.cacheManager.set(`app:${key}`, app ? app.toJson() : app, this.server.options.appManager.cache.ttl);
                return app;
            });
        });
    }
    getAppSecret(id) {
        return this.driver.getAppSecret(id);
    }
}
exports.AppManager = AppManager;
