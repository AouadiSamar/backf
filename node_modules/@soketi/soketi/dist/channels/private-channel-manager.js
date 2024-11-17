"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateChannelManager = void 0;
const public_channel_manager_1 = require("./public-channel-manager");
const Pusher = require('pusher');
class PrivateChannelManager extends public_channel_manager_1.PublicChannelManager {
    join(ws, channel, message) {
        var _a;
        let passedSignature = (_a = message === null || message === void 0 ? void 0 : message.data) === null || _a === void 0 ? void 0 : _a.auth;
        return this.signatureIsValid(ws.app, ws.id, message, passedSignature).then(isValid => {
            if (!isValid) {
                return {
                    ws,
                    success: false,
                    errorCode: 4009,
                    errorMessage: 'The connection is unauthorized.',
                    authError: true,
                    type: 'AuthError',
                };
            }
            return super.join(ws, channel, message).then(joinResponse => {
                if (joinResponse.success && ws.userAuthenticationTimeout) {
                    clearTimeout(ws.userAuthenticationTimeout);
                }
                return joinResponse;
            });
        });
    }
    signatureIsValid(app, socketId, message, signatureToCheck) {
        return this.getExpectedSignature(app, socketId, message).then(expectedSignature => {
            return signatureToCheck === expectedSignature;
        });
    }
    getExpectedSignature(app, socketId, message) {
        return new Promise(resolve => {
            let token = new Pusher.Token(app.key, app.secret);
            resolve(app.key + ':' + token.sign(this.getDataToSignForSignature(socketId, message)));
        });
    }
    getDataToSignForSignature(socketId, message) {
        return `${socketId}:${message.data.channel}`;
    }
}
exports.PrivateChannelManager = PrivateChannelManager;
