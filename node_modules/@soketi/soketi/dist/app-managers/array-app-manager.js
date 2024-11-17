"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArrayAppManager = void 0;
const app_1 = require("../app");
const base_app_manager_1 = require("./base-app-manager");
const log_1 = require("../log");
class ArrayAppManager extends base_app_manager_1.BaseAppManager {
    constructor(server) {
        super();
        this.server = server;
    }
    findById(id) {
        return new Promise(resolve => {
            let app = this.server.options.appManager.array.apps.find(app => app.id == id);
            if (typeof app !== 'undefined') {
                resolve(new app_1.App(app, this.server));
            }
            else {
                if (this.server.options.debug) {
                    log_1.Log.error(`App ID not found: ${id}`);
                }
                resolve(null);
            }
        });
    }
    findByKey(key) {
        return new Promise(resolve => {
            let app = this.server.options.appManager.array.apps.find(app => app.key == key);
            if (typeof app !== 'undefined') {
                resolve(new app_1.App(app, this.server));
            }
            else {
                if (this.server.options.debug) {
                    log_1.Log.error(`App key not found: ${key}`);
                }
                resolve(null);
            }
        });
    }
}
exports.ArrayAppManager = ArrayAppManager;
