"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAppManager = void 0;
class BaseAppManager {
    findById(id) {
        return Promise.resolve(null);
    }
    findByKey(key) {
        return Promise.resolve(null);
    }
    getAppSecret(id) {
        return this.findById(id).then(app => {
            return app
                ? app.secret
                : null;
        });
    }
}
exports.BaseAppManager = BaseAppManager;
