"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresAppManager = void 0;
const sql_app_manager_1 = require("./sql-app-manager");
class PostgresAppManager extends sql_app_manager_1.SqlAppManager {
    knexClientName() {
        return 'pg';
    }
    knexConnectionDetails() {
        return {
            ...this.server.options.database.postgres,
        };
    }
    knexVersion() {
        return this.server.options.appManager.postgres.version;
    }
    supportsPooling() {
        return true;
    }
    appsTableName() {
        return this.server.options.appManager.postgres.table;
    }
}
exports.PostgresAppManager = PostgresAppManager;
