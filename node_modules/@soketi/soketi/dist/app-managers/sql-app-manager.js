"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlAppManager = void 0;
const app_1 = require("./../app");
const base_app_manager_1 = require("./base-app-manager");
const log_1 = require("../log");
const knex_1 = require("knex");
class SqlAppManager extends base_app_manager_1.BaseAppManager {
    constructor(server) {
        super();
        this.server = server;
        let knexConfig = {
            client: this.knexClientName(),
            connection: this.knexConnectionDetails(),
            version: this.knexVersion(),
        };
        if (this.supportsPooling() && server.options.databasePooling.enabled) {
            knexConfig = {
                ...knexConfig,
                ...{
                    pool: {
                        min: server.options.databasePooling.min,
                        max: server.options.databasePooling.max,
                    },
                },
            };
        }
        this.connection = (0, knex_1.knex)(knexConfig);
    }
    findById(id) {
        return this.selectById(id).then(apps => {
            if (apps.length === 0) {
                if (this.server.options.debug) {
                    log_1.Log.error(`App ID not found: ${id}`);
                }
                return null;
            }
            return new app_1.App(apps[0] || apps, this.server);
        });
    }
    findByKey(key) {
        return this.selectByKey(key).then(apps => {
            if (apps.length === 0) {
                if (this.server.options.debug) {
                    log_1.Log.error(`App key not found: ${key}`);
                }
                return null;
            }
            return new app_1.App(apps[0] || apps, this.server);
        });
    }
    selectById(id) {
        return this.connection(this.appsTableName())
            .where('id', id)
            .select('*');
    }
    selectByKey(key) {
        return this.connection(this.appsTableName())
            .where('key', key)
            .select('*');
    }
}
exports.SqlAppManager = SqlAppManager;
