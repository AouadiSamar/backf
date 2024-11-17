"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MysqlAppManager = void 0;
const sql_app_manager_1 = require("./sql-app-manager");
class MysqlAppManager extends sql_app_manager_1.SqlAppManager {
    knexClientName() {
        return this.server.options.appManager.mysql.useMysql2
            ? 'mysql2'
            : 'mysql';
    }
    knexConnectionDetails() {
        return {
            ...this.server.options.database.mysql,
        };
    }
    knexVersion() {
        return this.server.options.appManager.mysql.version;
    }
    supportsPooling() {
        return true;
    }
    appsTableName() {
        return this.server.options.appManager.mysql.table;
    }
}
exports.MysqlAppManager = MysqlAppManager;
