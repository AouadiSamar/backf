"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Utils = void 0;
class Utils {
    static dataToBytes(...data) {
        return data.reduce((totalBytes, element) => {
            element = typeof element === 'string' ? element : JSON.stringify(element);
            try {
                return totalBytes += Buffer.byteLength(element, 'utf8');
            }
            catch (e) {
                return totalBytes;
            }
        }, 0);
    }
    static dataToKilobytes(...data) {
        return this.dataToBytes(...data) / 1024;
    }
    static dataToMegabytes(...data) {
        return this.dataToKilobytes(...data) / 1024;
    }
    static isPrivateChannel(channel) {
        let isPrivate = false;
        this._privateChannelPatterns.forEach(pattern => {
            let regex = new RegExp(pattern.replace('*', '.*'));
            if (regex.test(channel)) {
                isPrivate = true;
            }
        });
        return isPrivate;
    }
    static isPresenceChannel(channel) {
        return channel.lastIndexOf('presence-', 0) === 0;
    }
    static isEncryptedPrivateChannel(channel) {
        return channel.lastIndexOf('private-encrypted-', 0) === 0;
    }
    static isCachingChannel(channel) {
        let isCachingChannel = false;
        this._cachingChannelPatterns.forEach(pattern => {
            let regex = new RegExp(pattern.replace('*', '.*'));
            if (regex.test(channel)) {
                isCachingChannel = true;
            }
        });
        return isCachingChannel;
    }
    static isClientEvent(event) {
        let isClientEvent = false;
        this._clientEventPatterns.forEach(pattern => {
            let regex = new RegExp(pattern.replace('*', '.*'));
            if (regex.test(event)) {
                isClientEvent = true;
            }
        });
        return isClientEvent;
    }
    static restrictedChannelName(name) {
        return /^#?[-a-zA-Z0-9_=@,.;]+$/.test(name) === false;
    }
}
exports.Utils = Utils;
Utils._clientEventPatterns = [
    'client-*',
];
Utils._privateChannelPatterns = [
    'private-*',
    'private-encrypted-*',
    'presence-*',
];
Utils._cachingChannelPatterns = [
    'cache-*',
    'private-cache-*',
    'private-encrypted-cache-*',
    'presence-cache-*',
];
